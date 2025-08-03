<?php
// app/Http/Controllers/TestimonyController.php

namespace App\Http\Controllers;

use App\Models\Testimony;
use App\Models\Media;
use App\Models\Localization;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class TestimonyController extends Controller
{
    public function index(Request $request)
    {
        $query = Testimony::with(['media']);

        // Filter by featured
        if ($request->filled('featured')) {
            if ($request->featured === 'true') {
                $query->featured();
            }
        }

        // Search functionality
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('testimony_id', 'like', '%' . $request->search . '%')
                  ->orWhere('survivor_name', 'like', '%' . $request->search . '%')
                  ->orWhere('survivor_location', 'like', '%' . $request->search . '%')
                  ->orWhere('title_key', 'like', '%' . $request->search . '%');
            });
        }

        $testimonies = $query->active()->ordered()->paginate(12)->withQueryString();

        // Add translated content to each testimony
        $testimonies->getCollection()->transform(function ($item) {
            $item->translated_content = $item->getMultilingualContent();
            $item->media_count = $item->media->count();
            return $item;
        });

        return Inertia::render('Testimonies/Index', [
            'testimonies' => $testimonies,
            'filters' => $request->only(['featured', 'search']),
        ]);
    }

    public function create()
    {
        // Get available media for attachment
        $media = Media::active()->ordered()->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'media_id' => $item->media_id,
                'type' => $item->type,
                'url' => $item->getMediaUrl(),
                'thumbnail' => $item->getThumbnailUrl(),
                'title' => $item->getTranslation($item->title_key ?? '', 'en'),
            ];
        });

        return Inertia::render('Testimonies/Create', [
            'availableMedia' => $media,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'category_en' => 'nullable|string|max:255',
            'category_ar' => 'nullable|string|max:255',
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'description_en' => 'required|string',
            'description_ar' => 'required|string',
            'survivor_name' => 'nullable|string|max:255',
            'survivor_age' => 'nullable|integer|min:1|max:150',
            'survivor_location' => 'nullable|string|max:255',
            'date_of_incident' => 'nullable|date',
            'background_image' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:5000',
            'url_slug' => 'required|string|max:255|unique:testimonies,url_slug',
            'is_featured' => 'boolean',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'exists:media,id',
        ]);

        // Generate unique keys for localizations
        $testimonyId = 'testimony-' . time() . '-' . Str::random(6);
        $categoryKey = ($request->category_en || $request->category_ar) ? 
            'testimony_category_' . time() . '_' . Str::random(6) : null;
        $titleKey = 'testimony_title_' . time() . '_' . Str::random(6);
        $descriptionKey = 'testimony_desc_' . time() . '_' . Str::random(6);

        // Handle background image upload
        $backgroundImagePath = null;
        if ($request->hasFile('background_image')) {
            $backgroundImagePath = $request->file('background_image')->store('testimonies/backgrounds', 'public');
        }

        // Create the testimony record
        $testimony = Testimony::create([
            'testimony_id' => $testimonyId,
            'category_key' => $categoryKey,
            'title_key' => $titleKey,
            'description_key' => $descriptionKey,
            'survivor_name' => $request->survivor_name,
            'survivor_age' => $request->survivor_age,
            'survivor_location' => $request->survivor_location,
            'date_of_incident' => $request->date_of_incident,
            'background_image_path' => $backgroundImagePath,
            'url_slug' => $request->url_slug,
            'is_active' => true,
            'is_featured' => $request->boolean('is_featured'),
            'sort_order' => Testimony::max('sort_order') + 1,
        ]);

        // Create localizations
        foreach (['en', 'ar'] as $lang) {
            // Category localization (if provided)
            if ($categoryKey && $request->input("category_{$lang}")) {
                Localization::create([
                    'key' => $categoryKey,
                    'language' => $lang,
                    'value' => $request->input("category_{$lang}"),
                    'group' => 'testimonies',
                    'is_active' => true,
                ]);
            }

            // Title localization
            Localization::create([
                'key' => $titleKey,
                'language' => $lang,
                'value' => $request->input("title_{$lang}"),
                'group' => 'testimonies',
                'is_active' => true,
            ]);

            // Description localization
            Localization::create([
                'key' => $descriptionKey,
                'language' => $lang,
                'value' => $request->input("description_{$lang}"),
                'group' => 'testimonies',
                'is_active' => true,
            ]);
        }

        // Attach media if provided
        if ($request->media_ids) {
            $testimony->attachMedia($request->media_ids);
        }

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('testimonies.index')
            ->with('success', 'Testimony created successfully.');
    }

    public function show(Testimony $testimony)
    {
        $testimony->load(['media']);
        $testimony->translated_content = $testimony->getWithMedia();

        return Inertia::render('Testimonies/Show', [
            'testimony' => $testimony,
        ]);
    }

    public function edit(Testimony $testimony)
    {
        // Get current translations
        $translations = [];
        foreach (['en', 'ar'] as $lang) {
            if ($testimony->category_key) {
                $translations["category_{$lang}"] = Localization::where('key', $testimony->category_key)
                    ->where('language', $lang)
                    ->value('value') ?? '';
            }

            if ($testimony->title_key) {
                $translations["title_{$lang}"] = Localization::where('key', $testimony->title_key)
                    ->where('language', $lang)
                    ->value('value') ?? '';
            }

            if ($testimony->description_key) {
                $translations["description_{$lang}"] = Localization::where('key', $testimony->description_key)
                    ->where('language', $lang)
                    ->value('value') ?? '';
            }
        }

        // Get available media for attachment
        $availableMedia = Media::active()->ordered()->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'media_id' => $item->media_id,
                'type' => $item->type,
                'url' => $item->getMediaUrl(),
                'thumbnail' => $item->getThumbnailUrl(),
                'title' => $item->getTranslation($item->title_key ?? '', 'en'),
            ];
        });

        // Get currently attached media
        $attachedMedia = $testimony->media->pluck('id')->toArray();

        return Inertia::render('Testimonies/Edit', [
            'testimony' => $testimony,
            'translations' => $translations,
            'availableMedia' => $availableMedia,
            'attachedMedia' => $attachedMedia,
        ]);
    }

    public function update(Request $request, Testimony $testimony)
    {
        $request->validate([
            'category_en' => 'nullable|string|max:255',
            'category_ar' => 'nullable|string|max:255',
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'description_en' => 'required|string',
            'description_ar' => 'required|string',
            'survivor_name' => 'nullable|string|max:255',
            'survivor_age' => 'nullable|integer|min:1|max:150',
            'survivor_location' => 'nullable|string|max:255',
            'date_of_incident' => 'nullable|date',
            'background_image' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:5000',
            'url_slug' => 'required|string|max:255|unique:testimonies,url_slug,' . $testimony->id,
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'exists:media,id',
        ]);

        $updateData = [
            'survivor_name' => $request->survivor_name,
            'survivor_age' => $request->survivor_age,
            'survivor_location' => $request->survivor_location,
            'date_of_incident' => $request->date_of_incident,
            'url_slug' => $request->url_slug,
            'is_active' => $request->boolean('is_active', true),
            'is_featured' => $request->boolean('is_featured'),
        ];

        // Handle background image upload
        if ($request->hasFile('background_image')) {
            // Delete old image
            if ($testimony->background_image_path) {
                Storage::disk('public')->delete($testimony->background_image_path);
            }
            $updateData['background_image_path'] = $request->file('background_image')->store('testimonies/backgrounds', 'public');
        }

        // Update testimony record
        $testimony->update($updateData);

        // Update localizations
        foreach (['en', 'ar'] as $lang) {
            // Update category (create key if it doesn't exist)
            if ($request->input("category_{$lang}")) {
                if (!$testimony->category_key) {
                    $categoryKey = 'testimony_category_' . time() . '_' . Str::random(6);
                    $testimony->update(['category_key' => $categoryKey]);
                }

                Localization::updateOrCreate(
                    [
                        'key' => $testimony->category_key,
                        'language' => $lang,
                    ],
                    [
                        'value' => $request->input("category_{$lang}"),
                        'group' => 'testimonies',
                        'is_active' => true,
                    ]
                );
            }

            // Update title
            if ($testimony->title_key) {
                Localization::updateOrCreate(
                    [
                        'key' => $testimony->title_key,
                        'language' => $lang,
                    ],
                    [
                        'value' => $request->input("title_{$lang}"),
                        'group' => 'testimonies',
                        'is_active' => true,
                    ]
                );
            }

            // Update description
            if ($testimony->description_key) {
                Localization::updateOrCreate(
                    [
                        'key' => $testimony->description_key,
                        'language' => $lang,
                    ],
                    [
                        'value' => $request->input("description_{$lang}"),
                        'group' => 'testimonies',
                        'is_active' => true,
                    ]
                );
            }
        }

        // Update media attachments
        if ($request->has('media_ids')) {
            $testimony->media()->sync($request->media_ids ?? []);
        }

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('testimonies.index')
            ->with('success', 'Testimony updated successfully.');
    }

    public function destroy(Testimony $testimony)
    {
        // Delete background image
        if ($testimony->background_image_path) {
            Storage::disk('public')->delete($testimony->background_image_path);
        }

        // Delete related localizations
        if ($testimony->category_key) {
            Localization::where('key', $testimony->category_key)->delete();
        }
        if ($testimony->title_key) {
            Localization::where('key', $testimony->title_key)->delete();
        }
        if ($testimony->description_key) {
            Localization::where('key', $testimony->description_key)->delete();
        }

        // Detach media (don't delete the media files themselves)
        $testimony->media()->detach();

        // Delete testimony record
        $testimony->delete();

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('testimonies.index')
            ->with('success', 'Testimony deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:testimonies,id'
        ]);

        $testimonies = Testimony::whereIn('id', $request->ids)->get();

        foreach ($testimonies as $testimony) {
            // Delete background image
            if ($testimony->background_image_path) {
                Storage::disk('public')->delete($testimony->background_image_path);
            }

            // Delete localizations
            if ($testimony->category_key) {
                Localization::where('key', $testimony->category_key)->delete();
            }
            if ($testimony->title_key) {
                Localization::where('key', $testimony->title_key)->delete();
            }
            if ($testimony->description_key) {
                Localization::where('key', $testimony->description_key)->delete();
            }

            // Detach media
            $testimony->media()->detach();
        }

        Testimony::whereIn('id', $request->ids)->delete();

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('testimonies.index')
            ->with('success', count($request->ids) . ' testimonies deleted successfully.');
    }

    public function toggleFeatured(Testimony $testimony)
    {
        $testimony->update([
            'is_featured' => !$testimony->is_featured
        ]);

        return back()->with('success', 'Featured status updated.');
    }
}

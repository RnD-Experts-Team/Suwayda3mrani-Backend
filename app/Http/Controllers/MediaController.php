<?php
// app/Http/Controllers/MediaController.php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\Localization;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function index(Request $request)
    {
        $query = Media::with(['testimonies', 'cases']);

        // Filter by type
        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        // Filter by source type
        if ($request->filled('source_type')) {
            $query->bySourceType($request->source_type);
        }

        // Filter by featured on home
        if ($request->filled('featured')) {
            if ($request->featured === 'true') {
                $query->featuredOnHome();
            }
        }

        // Search functionality
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('media_id', 'like', '%' . $request->search . '%')
                  ->orWhere('title_key', 'like', '%' . $request->search . '%')
                  ->orWhere('description_key', 'like', '%' . $request->search . '%');
            });
        }

        $media = $query->ordered()->paginate(12)->withQueryString();

        // Add translated content to each media item
        $media->getCollection()->transform(function ($item) {
            $item->translated_content = $item->getMultilingualContent();
            return $item;
        });

        return Inertia::render('Media/Index', [
            'media' => $media,
            'filters' => $request->only(['type', 'source_type', 'featured', 'search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Media/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:image,video',
            'source_type' => 'required|in:upload,google_drive,external_link',
            'file' => 'nullable|file|mimes:jpeg,png,jpg,gif,mp4,avi,mov|max:50000',
            'google_drive_id' => 'nullable|string',
            'external_url' => 'nullable|url',
            'thumbnail' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:5000',
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'source_url' => 'nullable|url',
            'featured_on_home' => 'boolean',
        ]);

        // Generate unique keys for localizations
        $mediaId = 'media-' . time() . '-' . Str::random(6);
        $titleKey = 'media_title_' . time() . '_' . Str::random(6);
        $descriptionKey = $request->description_en || $request->description_ar ? 
            'media_desc_' . time() . '_' . Str::random(6) : null;

        // Handle file uploads and paths
        $filePath = null;
        $thumbnailPath = null;

        if ($request->source_type === 'upload' && $request->hasFile('file')) {
            $filePath = $request->file('file')->store('media', 'public');
        }

        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('media/thumbnails', 'public');
        }

        // Create the media record
        $media = Media::create([
            'media_id' => $mediaId,
            'type' => $request->type,
            'source_type' => $request->source_type,
            'file_path' => $filePath,
            'google_drive_id' => $request->google_drive_id,
            'external_url' => $request->external_url,
            'thumbnail_path' => $thumbnailPath,
            'title_key' => $titleKey,
            'description_key' => $descriptionKey,
            'source_url' => $request->source_url,
            'is_active' => true,
            'featured_on_home' => $request->boolean('featured_on_home'),
            'sort_order' => Media::max('sort_order') + 1,
        ]);

        // Create localizations
        foreach (['en', 'ar'] as $lang) {
            // Title localization
            Localization::create([
                'key' => $titleKey,
                'language' => $lang,
                'value' => $request->input("title_{$lang}"),
                'group' => 'media',
                'is_active' => true,
            ]);

            // Description localization (if provided)
            if ($descriptionKey && $request->input("description_{$lang}")) {
                Localization::create([
                    'key' => $descriptionKey,
                    'language' => $lang,
                    'value' => $request->input("description_{$lang}"),
                    'group' => 'media',
                    'is_active' => true,
                ]);
            }
        }

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('media.index')
            ->with('success', 'Media created successfully.');
    }

    public function show(Media $media)
    {
        $media->load(['testimonies', 'cases']);
        $media->translated_content = $media->getMultilingualContent();

        return Inertia::render('Media/Show', [
            'media' => $media,
        ]);
    }

    public function edit(Media $media)
    {
        // Get current translations
        $translations = [];
        foreach (['en', 'ar'] as $lang) {
            if ($media->title_key) {
                $translations["title_{$lang}"] = Localization::where('key', $media->title_key)
                    ->where('language', $lang)
                    ->value('value') ?? '';
            }

            if ($media->description_key) {
                $translations["description_{$lang}"] = Localization::where('key', $media->description_key)
                    ->where('language', $lang)
                    ->value('value') ?? '';
            }
        }

        return Inertia::render('Media/Edit', [
            'media' => $media,
            'translations' => $translations,
        ]);
    }

    public function update(Request $request, Media $media)
    {
        $request->validate([
            'type' => 'required|in:image,video',
            'source_type' => 'required|in:upload,google_drive,external_link',
            'file' => 'nullable|file|mimes:jpeg,png,jpg,gif,mp4,avi,mov|max:50000',
            'google_drive_id' => 'nullable|string',
            'external_url' => 'nullable|url',
            'thumbnail' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:5000',
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'source_url' => 'nullable|url',
            'featured_on_home' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // Handle file uploads
        $updateData = [
            'type' => $request->type,
            'source_type' => $request->source_type,
            'google_drive_id' => $request->google_drive_id,
            'external_url' => $request->external_url,
            'source_url' => $request->source_url,
            'is_active' => $request->boolean('is_active', true),
            'featured_on_home' => $request->boolean('featured_on_home'),
        ];

        // Handle new file upload
        if ($request->source_type === 'upload' && $request->hasFile('file')) {
            // Delete old file
            if ($media->file_path) {
                Storage::disk('public')->delete($media->file_path);
            }
            $updateData['file_path'] = $request->file('file')->store('media', 'public');
        } elseif ($request->source_type !== 'upload') {
            // Clear file path if switching away from upload
            if ($media->file_path) {
                Storage::disk('public')->delete($media->file_path);
                $updateData['file_path'] = null;
            }
        }

        // Handle thumbnail upload
        if ($request->hasFile('thumbnail')) {
            // Delete old thumbnail
            if ($media->thumbnail_path) {
                Storage::disk('public')->delete($media->thumbnail_path);
            }
            $updateData['thumbnail_path'] = $request->file('thumbnail')->store('media/thumbnails', 'public');
        }

        // Update media record
        $media->update($updateData);

        // Update localizations
        foreach (['en', 'ar'] as $lang) {
            // Update title
            if ($media->title_key) {
                Localization::updateOrCreate(
                    [
                        'key' => $media->title_key,
                        'language' => $lang,
                    ],
                    [
                        'value' => $request->input("title_{$lang}"),
                        'group' => 'media',
                        'is_active' => true,
                    ]
                );
            }

            // Update description
            if ($media->description_key && $request->input("description_{$lang}")) {
                Localization::updateOrCreate(
                    [
                        'key' => $media->description_key,
                        'language' => $lang,
                    ],
                    [
                        'value' => $request->input("description_{$lang}"),
                        'group' => 'media',
                        'is_active' => true,
                    ]
                );
            }
        }

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('media.index')
            ->with('success', 'Media updated successfully.');
    }

    public function destroy(Media $media)
    {
        // Delete files
        if ($media->file_path) {
            Storage::disk('public')->delete($media->file_path);
        }
        if ($media->thumbnail_path) {
            Storage::disk('public')->delete($media->thumbnail_path);
        }

        // Delete related localizations
        if ($media->title_key) {
            Localization::where('key', $media->title_key)->delete();
        }
        if ($media->description_key) {
            Localization::where('key', $media->description_key)->delete();
        }

        // Delete media record
        $media->delete();

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('media.index')
            ->with('success', 'Media deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:media,id'
        ]);

        $mediaItems = Media::whereIn('id', $request->ids)->get();

        foreach ($mediaItems as $media) {
            // Delete files
            if ($media->file_path) {
                Storage::disk('public')->delete($media->file_path);
            }
            if ($media->thumbnail_path) {
                Storage::disk('public')->delete($media->thumbnail_path);
            }

            // Delete localizations
            if ($media->title_key) {
                Localization::where('key', $media->title_key)->delete();
            }
            if ($media->description_key) {
                Localization::where('key', $media->description_key)->delete();
            }
        }

        Media::whereIn('id', $request->ids)->delete();

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('media.index')
            ->with('success', count($request->ids) . ' media items deleted successfully.');
    }

    public function toggleFeatured(Media $media)
    {
        $media->update([
            'featured_on_home' => !$media->featured_on_home
        ]);

        return back()->with('success', 'Featured status updated.');
    }

    public function updateSortOrder(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:media,id',
            'items.*.sort_order' => 'required|integer',
        ]);

        foreach ($request->items as $item) {
            Media::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['success' => true]);
    }
}

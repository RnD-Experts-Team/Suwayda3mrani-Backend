<?php
// app/Http/Controllers/CasesController.php

namespace App\Http\Controllers;

use App\Models\Cases;
use App\Models\CaseDetail;
use App\Models\Media;
use App\Models\Localization;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CasesController extends Controller
{
    public function index(Request $request)
    {
        $query = Cases::with(['details', 'media']);
        // Filter by type
        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        // Filter by featured
        if ($request->filled('featured')) {
            if ($request->featured === 'true') {
                $query->featured();
            }
        }

        // Search functionality
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('case_id', 'like', '%' . $request->search . '%')
                  ->orWhere('location', 'like', '%' . $request->search . '%')
                  ->orWhere('url_slug', 'like', '%' . $request->search . '%');
            });
        }

        $cases = $query->active()->ordered()->paginate(12)->withQueryString();

        // Add translated content to each case
        $cases->getCollection()->transform(function ($item) {
  
            $item->translated_content = $item->getMultilingualContent();
            $item->media_count = $item->media ? $item->media->count() : 0;
        return $item;
    });

        return Inertia::render('Cases/Index', [
            'cases' => $cases,
            'caseTypes' => Cases::getCaseTypes(),
            'filters' => $request->only(['type', 'featured', 'search']),
        ]);
    }

    public function create()
    {
        // Get available media items
        $mediaItems = Media::active()->ordered()->get()->map(function ($media) {
            $content = $media->getMultilingualContent();
            return [
                'id' => $media->id,
                'media_id' => $media->media_id,
                'type' => $media->type,
                'source_type' => $media->source_type,
                'title' => $content['title'] ?? ['en' => '', 'ar' => ''],
                'url' => $content['url'],
                'thumbnail' => $content['thumbnail'] ?? $content['url'],
            ];
        });

        return Inertia::render('Cases/Create', [
            'caseTypes' => Cases::getCaseTypes(),
            'mediaItems' => $mediaItems,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'type' => ['required', Rule::in(['deaths', 'houses', 'migrations', 'thefts'])],
            'incident_date' => 'required|date',
            'location' => 'nullable|string|max:255',
            'external_url' => 'nullable|url',
            'is_featured' => 'boolean',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'exists:media,id',
            'details' => 'nullable|array',
            'details.*.key_en' => 'required|string|max:255',
            'details.*.key_ar' => 'required|string|max:255',
            'details.*.value_en' => 'required|string|max:500',
            'details.*.value_ar' => 'required|string|max:500',
        ]);

        // Generate unique keys for localizations
        $caseId = 'case-' . $request->type . '-' . date('Y') . '-' . time();
        $titleKey = 'case_title_' . time() . '_' . Str::random(6);
        $descriptionKey = $request->description_en ? 'case_desc_' . time() . '_' . Str::random(6) : null;
        $urlSlug = Str::slug($caseId);

        // Create the case record
        $case = Cases::create([
            'case_id' => $caseId,
            'type' => $request->type,
            'title_key' => $titleKey,
            'description_key' => $descriptionKey,
            'url_slug' => $urlSlug,
            'external_url' => $request->external_url,
            'incident_date' => $request->incident_date,
            'location' => $request->location,
            'is_active' => true,
            'is_featured' => $request->boolean('is_featured'),
            'sort_order' => Cases::max('sort_order') + 1,
        ]);

        // Create localizations for title
        foreach (['en', 'ar'] as $lang) {
            Localization::create([
                'key' => $titleKey,
                'language' => $lang,
                'value' => $request->input("title_{$lang}"),
                'group' => 'cases',
                'is_active' => true,
            ]);

            // Create description localization if provided
            if ($descriptionKey && $request->input("description_{$lang}")) {
                Localization::create([
                    'key' => $descriptionKey,
                    'language' => $lang,
                    'value' => $request->input("description_{$lang}"),
                    'group' => 'cases',
                    'is_active' => true,
                ]);
            }
        }

        // Create case details
        if ($request->details) {
            foreach ($request->details as $index => $detail) {
                $keyLocalizationKey = 'case_detail_key_' . $case->id . '_' . $index . '_' . time();
                $valueLocalizationKey = 'case_detail_value_' . $case->id . '_' . $index . '_' . time();

                // Create localizations for detail key and value
                foreach (['en', 'ar'] as $lang) {
                    Localization::create([
                        'key' => $keyLocalizationKey,
                        'language' => $lang,
                        'value' => $detail["key_{$lang}"],
                        'group' => 'case_details',
                        'is_active' => true,
                    ]);

                    Localization::create([
                        'key' => $valueLocalizationKey,
                        'language' => $lang,
                        'value' => $detail["value_{$lang}"],
                        'group' => 'case_details',
                        'is_active' => true,
                    ]);
                }

                // Create case detail record
                CaseDetail::create([
                    'case_id' => $case->id,
                    'key_localization_key' => $keyLocalizationKey,
                    'value_localization_key' => $valueLocalizationKey,
                    'sort_order' => $index,
                ]);
            }
        }

        // Attach media if provided
        if ($request->media_ids) {
            $case->attachMedia($request->media_ids);
        }

        // Clear cache
        \Cache::forget('data_overview_frontend_data');

        return redirect()->route('cases.index')
            ->with('success', 'Case created successfully.');
    }

    public function show(Cases $case)
    {
        $case->load(['details', 'media']);
        $case->translated_content = $case->getMultilingualContent();
        
        // Get attached media with full content
        $attachedMedia = $case->media->map(function ($media) {
            return array_merge($media->toArray(), [
                'translated_content' => $media->getMultilingualContent()
            ]);
        });

        return Inertia::render('Cases/Show', [
            'case' => $case,
            'attachedMedia' => $attachedMedia,
            'caseTypes' => Cases::getCaseTypes(),
        ]);
    }

    public function edit(Cases $case)
    {
        // Get current translations
        $translations = [];
        foreach (['en', 'ar'] as $lang) {
            if ($case->title_key) {
                $translations["title_{$lang}"] = Localization::where('key', $case->title_key)
                    ->where('language', $lang)
                    ->value('value') ?? '';
            }

            if ($case->description_key) {
                $translations["description_{$lang}"] = Localization::where('key', $case->description_key)
                    ->where('language', $lang)
                    ->value('value') ?? '';
            }
        }

        // Get case details with translations
        $detailsData = $case->details->map(function ($detail) {
            $keyTranslations = $detail->getKeyTranslations();
            $valueTranslations = $detail->getValueTranslations();
            
            return [
                'id' => $detail->id,
                'key_en' => $keyTranslations['en'],
                'key_ar' => $keyTranslations['ar'],
                'value_en' => $valueTranslations['en'],
                'value_ar' => $valueTranslations['ar'],
                'sort_order' => $detail->sort_order,
            ];
        })->toArray();

        // Get available media items
        $mediaItems = Media::active()->ordered()->get()->map(function ($media) {
            $content = $media->getMultilingualContent();
            return [
                'id' => $media->id,
                'media_id' => $media->media_id,
                'type' => $media->type,
                'source_type' => $media->source_type,
                'title' => $content['title'] ?? ['en' => '', 'ar' => ''],
                'url' => $content['url'],
                'thumbnail' => $content['thumbnail'] ?? $content['url'],
            ];
        });

        // Get currently attached media IDs
        $attachedMediaIds = $case->media->pluck('id')->toArray();

        return Inertia::render('Cases/Edit', [
            'case' => $case,
            'translations' => $translations,
            'details' => $detailsData,
            'caseTypes' => Cases::getCaseTypes(),
            'mediaItems' => $mediaItems,
            'attachedMediaIds' => $attachedMediaIds,
        ]);
    }

    public function update(Request $request, Cases $case)
    {
        $request->validate([
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'description_en' => 'nullable|string',
            'description_ar' => 'nullable|string',
            'type' => ['required', Rule::in(['deaths', 'houses', 'migrations', 'thefts'])],
            'incident_date' => 'required|date',
            'location' => 'nullable|string|max:255',
            'external_url' => 'nullable|url',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'media_ids' => 'nullable|array',
            'media_ids.*' => 'exists:media,id',
            'details' => 'nullable|array',
            'details.*.key_en' => 'required|string|max:255',
            'details.*.key_ar' => 'required|string|max:255',
            'details.*.value_en' => 'required|string|max:500',
            'details.*.value_ar' => 'required|string|max:500',
        ]);

        // Update case record
        $case->update([
            'type' => $request->type,
            'incident_date' => $request->incident_date,
            'location' => $request->location,
            'external_url' => $request->external_url,
            'is_active' => $request->boolean('is_active', true),
            'is_featured' => $request->boolean('is_featured'),
        ]);

        // Update localizations for title
        foreach (['en', 'ar'] as $lang) {
            if ($case->title_key) {
                Localization::updateOrCreate([
                    'key' => $case->title_key,
                    'language' => $lang,
                ], [
                    'value' => $request->input("title_{$lang}"),
                    'group' => 'cases',
                    'is_active' => true,
                ]);
            }

            // Update or create description localization
            if ($request->input("description_{$lang}")) {
                if (!$case->description_key) {
                    $case->description_key = 'case_desc_' . time() . '_' . Str::random(6);
                    $case->save();
                }

                Localization::updateOrCreate([
                    'key' => $case->description_key,
                    'language' => $lang,
                ], [
                    'value' => $request->input("description_{$lang}"),
                    'group' => 'cases',
                    'is_active' => true,
                ]);
            }
        }

        // Delete existing details and their localizations
        foreach ($case->details as $detail) {
            Localization::where('key', $detail->key_localization_key)->delete();
            Localization::where('key', $detail->value_localization_key)->delete();
            $detail->delete();
        }

        // Create new details
        if ($request->details) {
            foreach ($request->details as $index => $detail) {
                $keyLocalizationKey = 'case_detail_key_' . $case->id . '_' . $index . '_' . time();
                $valueLocalizationKey = 'case_detail_value_' . $case->id . '_' . $index . '_' . time();

                // Create localizations for detail key and value
                foreach (['en', 'ar'] as $lang) {
                    Localization::create([
                        'key' => $keyLocalizationKey,
                        'language' => $lang,
                        'value' => $detail["key_{$lang}"],
                        'group' => 'case_details',
                        'is_active' => true,
                    ]);

                    Localization::create([
                        'key' => $valueLocalizationKey,
                        'language' => $lang,
                        'value' => $detail["value_{$lang}"],
                        'group' => 'case_details',
                        'is_active' => true,
                    ]);
                }

                // Create case detail record
                CaseDetail::create([
                    'case_id' => $case->id,
                    'key_localization_key' => $keyLocalizationKey,
                    'value_localization_key' => $valueLocalizationKey,
                    'sort_order' => $index,
                ]);
            }
        }

        // Update media attachments
        $case->media()->detach();
        if ($request->media_ids) {
            $case->attachMedia($request->media_ids);
        }

        // Clear cache
        \Cache::forget('data_overview_frontend_data');

        return redirect()->route('cases.index')
            ->with('success', 'Case updated successfully.');
    }

    public function destroy(Cases $case)
    {
        // Delete related localizations
        if ($case->title_key) {
            Localization::where('key', $case->title_key)->delete();
        }
        if ($case->description_key) {
            Localization::where('key', $case->description_key)->delete();
        }

        // Delete case details and their localizations
        foreach ($case->details as $detail) {
            Localization::where('key', $detail->key_localization_key)->delete();
            Localization::where('key', $detail->value_localization_key)->delete();
            $detail->delete();
        }

        // Detach media
        $case->media()->detach();

        // Delete case record
        $case->delete();

        // Clear cache
        \Cache::forget('data_overview_frontend_data');

        return redirect()->route('cases.index')
            ->with('success', 'Case deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:cases,id'
        ]);

        $cases = Cases::whereIn('id', $request->ids)->get();

        foreach ($cases as $case) {
            // Delete localizations
            if ($case->title_key) {
                Localization::where('key', $case->title_key)->delete();
            }
            if ($case->description_key) {
                Localization::where('key', $case->description_key)->delete();
            }

            // Delete case details and their localizations
            foreach ($case->details as $detail) {
                Localization::where('key', $detail->key_localization_key)->delete();
                Localization::where('key', $detail->value_localization_key)->delete();
                $detail->delete();
            }

            // Detach media
            $case->media()->detach();
        }

        Cases::whereIn('id', $request->ids)->delete();

        // Clear cache
        \Cache::forget('data_overview_frontend_data');

        return redirect()->route('cases.index')
            ->with('success', count($request->ids) . ' cases deleted successfully.');
    }

    public function toggleFeatured(Cases $case)
    {
        $case->update(['is_featured' => !$case->is_featured]);

        // Clear cache
        \Cache::forget('data_overview_frontend_data');

        return back()->with('success', 'Case featured status updated successfully.');
    }
}

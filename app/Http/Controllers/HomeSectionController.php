<?php
// app/Http/Controllers/HomeSectionController.php

namespace App\Http\Controllers;

use App\Models\HomeSection;
use App\Models\Localization;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class HomeSectionController extends Controller
{
    public function index(Request $request)
    {
        $query = HomeSection::query();

        // Filter by type
        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        // Search functionality
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('section_id', 'like', '%' . $request->search . '%')
                  ->orWhere('type', 'like', '%' . $request->search . '%');
            });
        }

        $homeSections = $query->ordered()->paginate(12)->withQueryString();

        // Add translated content to each section
        $homeSections->getCollection()->transform(function ($item) {
            $item->translated_content = [
                'title' => $this->getTranslationsForKey($item->title_key),
                'description' => $this->getTranslationsForKey($item->description_key),
                'button_text' => $this->getTranslationsForKey($item->button_text_key),
            ];
            return $item;
        });

        return Inertia::render('HomeSections/Index', [
            'homeSections' => $homeSections,
            'filters' => $request->only(['type', 'search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('HomeSections/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:hero,suggestion',
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'description_en' => 'required|string',
            'description_ar' => 'required|string',
            'button_text_en' => 'nullable|string|max:255',
            'button_text_ar' => 'nullable|string|max:255',
            'button_variant' => 'nullable|string|max:50',
            'action_key' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5000',
            'sort_order' => 'integer|min:0',
        ]);

        DB::transaction(function () use ($request) {
            // Generate unique keys
            $sectionId = 'home-section-' . time() . '-' . Str::random(6);
            $titleKey = 'home_section_title_' . time() . '_' . Str::random(6);
            $descriptionKey = 'home_section_description_' . time() . '_' . Str::random(6);
            $buttonTextKey = null;

            if ($request->filled('button_text_en') || $request->filled('button_text_ar')) {
                $buttonTextKey = 'home_section_button_' . time() . '_' . Str::random(6);
            }

            // Handle image upload
            $imagePath = null;
            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('home-sections', 'public');
            }

            // Create home section
            $homeSection = HomeSection::create([
                'section_id' => $sectionId,
                'type' => $request->type,
                'title_key' => $titleKey,
                'description_key' => $descriptionKey,
                'button_text_key' => $buttonTextKey,
                'button_variant' => $request->button_variant,
                'action_key' => $request->action_key,
                'image_path' => $imagePath,
                'sort_order' => $request->sort_order ?? 0,
            ]);

            // Create localizations
            foreach (['en', 'ar'] as $language) {
                // Title localization
                Localization::create([
                    'key' => $titleKey,
                    'language' => $language,
                    'group' => 'home_sections',
                    'value' => $request->input("title_{$language}"),
                    'is_active' => true,
                ]);

                // Description localization
                Localization::create([
                    'key' => $descriptionKey,
                    'language' => $language,
                    'group' => 'home_sections',
                    'value' => $request->input("description_{$language}"),
                    'is_active' => true,
                ]);

                // Button text localization (if provided)
                if ($buttonTextKey && ($request->filled("button_text_{$language}"))) {
                    Localization::create([
                        'key' => $buttonTextKey,
                        'language' => $language,
                        'group' => 'home_sections',
                        'value' => $request->input("button_text_{$language}"),
                        'is_active' => true,
                    ]);
                }
            }
        });

        // Clear cache
        \Cache::forget('home_frontend_data_v3');
        \Cache::forget('layout_frontend_data_v3');

        return redirect()->route('home-sections.index')
            ->with('success', 'Home section created successfully.');
    }

    public function show(HomeSection $homeSection)
    {
        $homeSection->translated_content = [
            'title' => $this->getTranslationsForKey($homeSection->title_key),
            'description' => $this->getTranslationsForKey($homeSection->description_key),
            'button_text' => $this->getTranslationsForKey($homeSection->button_text_key),
        ];

        return Inertia::render('HomeSections/Show', [
            'homeSection' => $homeSection,
        ]);
    }

    public function edit(HomeSection $homeSection)
    {
        // Get current translations
        $translations = [
            'title_en' => '',
            'title_ar' => '',
            'description_en' => '',
            'description_ar' => '',
            'button_text_en' => '',
            'button_text_ar' => '',
        ];

        if ($homeSection->title_key) {
            $titleTranslations = $this->getTranslationsForKey($homeSection->title_key);
            $translations['title_en'] = $titleTranslations['en'];
            $translations['title_ar'] = $titleTranslations['ar'];
        }

        if ($homeSection->description_key) {
            $descriptionTranslations = $this->getTranslationsForKey($homeSection->description_key);
            $translations['description_en'] = $descriptionTranslations['en'];
            $translations['description_ar'] = $descriptionTranslations['ar'];
        }

        if ($homeSection->button_text_key) {
            $buttonTextTranslations = $this->getTranslationsForKey($homeSection->button_text_key);
            $translations['button_text_en'] = $buttonTextTranslations['en'];
            $translations['button_text_ar'] = $buttonTextTranslations['ar'];
        }

        return Inertia::render('HomeSections/Edit', [
            'homeSection' => $homeSection,
            'translations' => $translations,
        ]);
    }

    public function update(Request $request, HomeSection $homeSection)
    {
        $request->validate([
            'type' => 'required|in:hero,suggestion',
            'title_en' => 'required|string|max:255',
            'title_ar' => 'required|string|max:255',
            'description_en' => 'required|string',
            'description_ar' => 'required|string',
            'button_text_en' => 'nullable|string|max:255',
            'button_text_ar' => 'nullable|string|max:255',
            'button_variant' => 'nullable|string|max:50',
            'action_key' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5000',
            'sort_order' => 'integer|min:0',
        ]);

        DB::transaction(function () use ($request, $homeSection) {
            $updateData = [
                'type' => $request->type,
                'button_variant' => $request->button_variant,
                'action_key' => $request->action_key,
                'sort_order' => $request->sort_order ?? 0,
            ];

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image
                if ($homeSection->image_path) {
                    Storage::disk('public')->delete($homeSection->image_path);
                }
                $updateData['image_path'] = $request->file('image')->store('home-sections', 'public');
            }

            // Create button text key if it doesn't exist and we have button text
            if (!$homeSection->button_text_key && ($request->filled('button_text_en') || $request->filled('button_text_ar'))) {
                $updateData['button_text_key'] = 'home_section_button_' . time() . '_' . Str::random(6);
            }

            // Update home section record
            $homeSection->update($updateData);

            // Update localizations
            foreach (['en', 'ar'] as $language) {
                // Update title
                if ($homeSection->title_key) {
                    Localization::updateOrCreate(
                        [
                            'key' => $homeSection->title_key,
                            'language' => $language,
                        ],
                        [
                            'value' => $request->input("title_{$language}"),
                            'group' => 'home_sections',
                            'is_active' => true,
                        ]
                    );
                }

                // Update description
                if ($homeSection->description_key) {
                    Localization::updateOrCreate(
                        [
                            'key' => $homeSection->description_key,
                            'language' => $language,
                        ],
                        [
                            'value' => $request->input("description_{$language}"),
                            'group' => 'home_sections',
                            'is_active' => true,
                        ]
                    );
                }

                // Update button text (if provided)
                if ($homeSection->button_text_key && $request->filled("button_text_{$language}")) {
                    Localization::updateOrCreate(
                        [
                            'key' => $homeSection->button_text_key,
                            'language' => $language,
                        ],
                        [
                            'value' => $request->input("button_text_{$language}"),
                            'group' => 'home_sections',
                            'is_active' => true,
                        ]
                    );
                }
            }
        });

        // Clear cache
        \Cache::forget('home_frontend_data_v3');
        \Cache::forget('layout_frontend_data_v3');

        return redirect()->route('home-sections.index')
            ->with('success', 'Home section updated successfully.');
    }

    public function destroy(HomeSection $homeSection)
    {
        DB::transaction(function () use ($homeSection) {
            // Delete image
            if ($homeSection->image_path) {
                Storage::disk('public')->delete($homeSection->image_path);
            }

            // Delete related localizations
            $keysToDelete = array_filter([
                $homeSection->title_key,
                $homeSection->description_key,
                $homeSection->button_text_key,
            ]);

            if (!empty($keysToDelete)) {
                Localization::whereIn('key', $keysToDelete)->delete();
            }

            // Delete home section record
            $homeSection->delete();
        });

        // Clear cache
        \Cache::forget('home_frontend_data_v3');
        \Cache::forget('layout_frontend_data_v3');

        return redirect()->route('home-sections.index')
            ->with('success', 'Home section deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:home_sections,id'
        ]);

        DB::transaction(function () use ($request) {
            $homeSections = HomeSection::whereIn('id', $request->ids)->get();

            foreach ($homeSections as $homeSection) {
                // Delete image
                if ($homeSection->image_path) {
                    Storage::disk('public')->delete($homeSection->image_path);
                }

                // Collect localization keys
                $keysToDelete = array_filter([
                    $homeSection->title_key,
                    $homeSection->description_key,
                    $homeSection->button_text_key,
                ]);

                if (!empty($keysToDelete)) {
                    Localization::whereIn('key', $keysToDelete)->delete();
                }
            }

            HomeSection::whereIn('id', $request->ids)->delete();
        });

        // Clear cache
        \Cache::forget('home_frontend_data_v3');
        \Cache::forget('layout_frontend_data_v3');

        return redirect()->route('home-sections.index')
            ->with('success', count($request->ids) . ' home sections deleted successfully.');
    }

    private function getTranslationsForKey(?string $key): array
    {
        if (!$key) {
            return ['en' => '', 'ar' => ''];
        }

        $translations = Localization::where('key', $key)
            ->whereIn('language', ['en', 'ar'])
            ->where('is_active', true)
            ->pluck('value', 'language')
            ->toArray();

        return [
            'en' => $translations['en'] ?? '',
            'ar' => $translations['ar'] ?? ''
        ];
    }
}

<?php
// app/Http/Controllers/AidCategoryController.php

namespace App\Http\Controllers;

use App\Models\AidCategory;
use App\Models\Localization;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class AidCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = AidCategory::withCount('organizations');

        // Search functionality
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name_key', 'like', '%' . $request->search . '%')
                  ->orWhere('slug', 'like', '%' . $request->search . '%');
            });
        }

        $categories = $query->ordered()->paginate(15)->withQueryString();

        // Add translated content to each category
        $categories->getCollection()->transform(function ($item) {
            $item->translated_content = $item->getMultilingualContent();
            return $item;
        });

        return Inertia::render('AidCategories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('AidCategories/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name_en' => 'required|string|max:255',
            'name_ar' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:aid_categories,slug',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        // Generate unique key for localization
        $nameKey = 'aid_category_name_' . time() . '_' . Str::random(6);

        // Create the category record
        $category = AidCategory::create([
            'name_key' => $nameKey,
            'slug' => $request->slug,
            'icon' => $request->icon,
            'color' => $request->color,
            'is_active' => true,
            'sort_order' => AidCategory::max('sort_order') + 1,
        ]);

        // Create localizations
        foreach (['en', 'ar'] as $lang) {
            Localization::create([
                'key' => $nameKey,
                'language' => $lang,
                'value' => $request->input("name_{$lang}"),
                'group' => 'aid_categories',
                'is_active' => true,
            ]);
        }

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('aid-categories.index')
            ->with('success', 'Aid category created successfully.');
    }

    public function edit(AidCategory $aidCategory)
    {
        // Get current translations
        $translations = [];
        foreach (['en', 'ar'] as $lang) {
            if ($aidCategory->name_key) {
                $translations["name_{$lang}"] = Localization::where('key', $aidCategory->name_key)
                    ->where('language', $lang)
                    ->value('value') ?? '';
            }
        }

        return Inertia::render('AidCategories/Edit', [
            'category' => $aidCategory,
            'translations' => $translations,
        ]);
    }

    public function update(Request $request, AidCategory $aidCategory)
    {
        $request->validate([
            'name_en' => 'required|string|max:255',
            'name_ar' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:aid_categories,slug,' . $aidCategory->id,
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active' => 'boolean',
        ]);

        // Update category record
        $aidCategory->update([
            'slug' => $request->slug,
            'icon' => $request->icon,
            'color' => $request->color,
            'is_active' => $request->boolean('is_active', true),
        ]);

        // Update localizations
        foreach (['en', 'ar'] as $lang) {
            if ($aidCategory->name_key) {
                Localization::updateOrCreate(
                    [
                        'key' => $aidCategory->name_key,
                        'language' => $lang,
                    ],
                    [
                        'value' => $request->input("name_{$lang}"),
                        'group' => 'aid_categories',
                        'is_active' => true,
                    ]
                );
            }
        }

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('aid-categories.index')
            ->with('success', 'Aid category updated successfully.');
    }

    public function destroy(AidCategory $aidCategory)
    {
        // Check if category is being used by any organizations
        if ($aidCategory->organizations()->count() > 0) {
            return back()->withErrors([
                'error' => 'Cannot delete category that is being used by organizations.'
            ]);
        }

        // Delete related localizations
        if ($aidCategory->name_key) {
            Localization::where('key', $aidCategory->name_key)->delete();
        }

        // Delete category record
        $aidCategory->delete();

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('aid-categories.index')
            ->with('success', 'Aid category deleted successfully.');
    }
}

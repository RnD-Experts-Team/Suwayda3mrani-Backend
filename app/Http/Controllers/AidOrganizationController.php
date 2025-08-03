<?php
// app/Http/Controllers/AidOrganizationController.php

namespace App\Http\Controllers;

use App\Models\AidOrganization;
use App\Models\AidCategory;
use App\Models\Localization;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class AidOrganizationController extends Controller
{
    public function index(Request $request)
    {
        $query = AidOrganization::with(['categories']);

        // Filter by type
        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        // Filter by category
        if ($request->filled('category')) {
            $query->byCategory($request->category);
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
                $q->where('organization_id', 'like', '%' . $request->search . '%')
                  ->orWhere('name_key', 'like', '%' . $request->search . '%')
                  ->orWhere('website_url', 'like', '%' . $request->search . '%');
            });
        }

        $organizations = $query->active()->ordered()->paginate(12)->withQueryString();

        // Add translated content to each organization
        $organizations->getCollection()->transform(function ($item) {
            $item->translated_content = $item->getMultilingualContent();
            $item->categories_count = $item->categories->count();
            return $item;
        });

        // Get available categories for filtering
        $categories = AidCategory::active()->ordered()->get()->map(function ($category) {
            return [
                'slug' => $category->slug,
                'name' => $category->getTranslatedName('en'),
            ];
        });

        return Inertia::render('AidOrganizations/Index', [
            'organizations' => $organizations,
            'categories' => $categories,
            'filters' => $request->only(['type', 'category', 'featured', 'search']),
        ]);
    }

    public function create()
    {
        // Get available categories
        $categories = AidCategory::active()->ordered()->get()->map(function ($category) {
            return [
                'id' => $category->id,
                'slug' => $category->slug,
                'name' => $category->getTranslatedName('en'),
                'name_ar' => $category->getTranslatedName('ar'),
            ];
        });

        return Inertia::render('AidOrganizations/Create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name_en' => 'required|string|max:255',
            'name_ar' => 'required|string|max:255',
            'description_en' => 'required|string',
            'description_ar' => 'required|string',
            'background_image' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:5000',
            'website_url' => 'nullable|url',
            'contact_url' => 'nullable|url',
            'type' => 'required|in:organizations,initiatives',
            'is_featured' => 'boolean',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:aid_categories,id',
        ]);

        // Generate unique keys for localizations
        $organizationId = 'aid-org-' . time() . '-' . Str::random(6);
        $nameKey = 'aid_org_name_' . time() . '_' . Str::random(6);
        $descriptionKey = 'aid_org_desc_' . time() . '_' . Str::random(6);

        // Handle background image upload
        $backgroundImagePath = null;
        if ($request->hasFile('background_image')) {
            $backgroundImagePath = $request->file('background_image')->store('aid-organizations/backgrounds', 'public');
        }

        // Create the organization record
        $organization = AidOrganization::create([
            'organization_id' => $organizationId,
            'name_key' => $nameKey,
            'description_key' => $descriptionKey,
            'background_image_path' => $backgroundImagePath,
            'website_url' => $request->website_url,
            'contact_url' => $request->contact_url,
            'type' => $request->type,
            'is_active' => true,
            'is_featured' => $request->boolean('is_featured'),
            'sort_order' => AidOrganization::max('sort_order') + 1,
        ]);

        // Create localizations
        foreach (['en', 'ar'] as $lang) {
            // Name localization
            Localization::create([
                'key' => $nameKey,
                'language' => $lang,
                'value' => $request->input("name_{$lang}"),
                'group' => 'aid_organizations',
                'is_active' => true,
            ]);

            // Description localization
            Localization::create([
                'key' => $descriptionKey,
                'language' => $lang,
                'value' => $request->input("description_{$lang}"),
                'group' => 'aid_organizations',
                'is_active' => true,
            ]);
        }

        // Attach categories if provided
        if ($request->category_ids) {
            $organization->attachCategories($request->category_ids);
        }

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('aid-organizations.index')
            ->with('success', 'Aid organization created successfully.');
    }

    public function show(AidOrganization $aidOrganization)
    {
        $aidOrganization->load(['categories']);
        $aidOrganization->translated_content = $aidOrganization->getMultilingualContent();

        return Inertia::render('AidOrganizations/Show', [
            'organization' => $aidOrganization,
        ]);
    }

    public function edit(AidOrganization $aidOrganization)
    {
        // Get current translations
        $translations = [];
        foreach (['en', 'ar'] as $lang) {
            if ($aidOrganization->name_key) {
                $translations["name_{$lang}"] = Localization::where('key', $aidOrganization->name_key)
                    ->where('language', $lang)
                    ->value('value') ?? '';
            }

            if ($aidOrganization->description_key) {
                $translations["description_{$lang}"] = Localization::where('key', $aidOrganization->description_key)
                    ->where('language', $lang)
                    ->value('value') ?? '';
            }
        }

        // Get available categories
        $categories = AidCategory::active()->ordered()->get()->map(function ($category) {
            return [
                'id' => $category->id,
                'slug' => $category->slug,
                'name' => $category->getTranslatedName('en'),
                'name_ar' => $category->getTranslatedName('ar'),
            ];
        });

        // Get currently attached categories
        $attachedCategories = $aidOrganization->categories->pluck('id')->toArray();

        return Inertia::render('AidOrganizations/Edit', [
            'organization' => $aidOrganization,
            'translations' => $translations,
            'categories' => $categories,
            'attachedCategories' => $attachedCategories,
        ]);
    }

    public function update(Request $request, AidOrganization $aidOrganization)
    {
        $request->validate([
            'name_en' => 'required|string|max:255',
            'name_ar' => 'required|string|max:255',
            'description_en' => 'required|string',
            'description_ar' => 'required|string',
            'background_image' => 'nullable|file|mimes:jpeg,png,jpg,gif|max:5000',
            'website_url' => 'nullable|url',
            'contact_url' => 'nullable|url',
            'type' => 'required|in:organizations,initiatives',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'exists:aid_categories,id',
        ]);

        $updateData = [
            'website_url' => $request->website_url,
            'contact_url' => $request->contact_url,
            'type' => $request->type,
            'is_active' => $request->boolean('is_active', true),
            'is_featured' => $request->boolean('is_featured'),
        ];

        // Handle background image upload
        if ($request->hasFile('background_image')) {
            // Delete old image
            if ($aidOrganization->background_image_path) {
                Storage::disk('public')->delete($aidOrganization->background_image_path);
            }
            $updateData['background_image_path'] = $request->file('background_image')->store('aid-organizations/backgrounds', 'public');
        }

        // Update organization record
        $aidOrganization->update($updateData);

        // Update localizations
        foreach (['en', 'ar'] as $lang) {
            // Update name
            if ($aidOrganization->name_key) {
                Localization::updateOrCreate(
                    [
                        'key' => $aidOrganization->name_key,
                        'language' => $lang,
                    ],
                    [
                        'value' => $request->input("name_{$lang}"),
                        'group' => 'aid_organizations',
                        'is_active' => true,
                    ]
                );
            }

            // Update description
            if ($aidOrganization->description_key) {
                Localization::updateOrCreate(
                    [
                        'key' => $aidOrganization->description_key,
                        'language' => $lang,
                    ],
                    [
                        'value' => $request->input("description_{$lang}"),
                        'group' => 'aid_organizations',
                        'is_active' => true,
                    ]
                );
            }
        }

        // Update category attachments
        if ($request->has('category_ids')) {
            $aidOrganization->categories()->sync($request->category_ids ?? []);
        }

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('aid-organizations.index')
            ->with('success', 'Aid organization updated successfully.');
    }

    public function destroy(AidOrganization $aidOrganization)
    {
        // Delete background image
        if ($aidOrganization->background_image_path) {
            Storage::disk('public')->delete($aidOrganization->background_image_path);
        }

        // Delete related localizations
        if ($aidOrganization->name_key) {
            Localization::where('key', $aidOrganization->name_key)->delete();
        }
        if ($aidOrganization->description_key) {
            Localization::where('key', $aidOrganization->description_key)->delete();
        }

        // Detach categories
        $aidOrganization->categories()->detach();

        // Delete organization record
        $aidOrganization->delete();

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('aid-organizations.index')
            ->with('success', 'Aid organization deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:aid_organizations,id'
        ]);

        $organizations = AidOrganization::whereIn('id', $request->ids)->get();

        foreach ($organizations as $organization) {
            // Delete background image
            if ($organization->background_image_path) {
                Storage::disk('public')->delete($organization->background_image_path);
            }

            // Delete localizations
            if ($organization->name_key) {
                Localization::where('key', $organization->name_key)->delete();
            }
            if ($organization->description_key) {
                Localization::where('key', $organization->description_key)->delete();
            }

            // Detach categories
            $organization->categories()->detach();
        }

        AidOrganization::whereIn('id', $request->ids)->delete();

        // Clear cache
        \Cache::forget('frontend_grouped_translations');
        \Cache::forget('layout_translations');

        return redirect()->route('aid-organizations.index')
            ->with('success', count($request->ids) . ' aid organizations deleted successfully.');
    }

    public function toggleFeatured(AidOrganization $aidOrganization)
    {
        $aidOrganization->update([
            'is_featured' => !$aidOrganization->is_featured
        ]);

        return back()->with('success', 'Featured status updated.');
    }
}

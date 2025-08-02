<?php
// app/Http/Controllers/LocalizationController.php

namespace App\Http\Controllers;

use App\Models\Localization;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use App\Http\Requests\StoreLocalizationRequest;
use App\Http\Requests\UpdateLocalizationRequest;

class LocalizationController extends Controller
{
    public function index(Request $request)
    {
        $query = Localization::query();

        // Filter by language
        if ($request->filled('language')) {
            $query->byLanguage($request->language);
        }

        // Filter by group
        if ($request->filled('group')) {
            $query->byGroup($request->group);
        }

        // Search functionality
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('key', 'like', '%' . $request->search . '%')
                  ->orWhere('value', 'like', '%' . $request->search . '%')
                  ->orWhere('group', 'like', '%' . $request->search . '%');
            });
        }

        $localizations = $query->orderBy('language')
            ->orderBy('group')
            ->orderBy('key')
            ->paginate(50)
            ->withQueryString();

        $languages = Localization::distinct()->pluck('language')->sort()->values();
        $groups = Localization::distinct()->whereNotNull('group')->pluck('group')->sort()->values();

        return Inertia::render('Localizations/Index', [
            'localizations' => $localizations,
            'languages' => $languages,
            'groups' => $groups,
            'filters' => $request->only(['language', 'group', 'search']),
        ]);
    }

    public function create()
    {
        $languages = Localization::distinct()->pluck('language')->sort()->values();
        $groups = Localization::distinct()->whereNotNull('group')->pluck('group')->sort()->values();

        return Inertia::render('Localizations/Create', [
            'languages' => $languages,
            'groups' => $groups,
        ]);
    }

    public function store(StoreLocalizationRequest $request)
    {
        Localization::create($request->validated());

        return redirect()->route('localizations.index')
            ->with('success', 'Localization created successfully.');
    }

    public function show(Localization $localization)
    {
        return Inertia::render('Localizations/Show', [
            'localization' => $localization,
        ]);
    }

    public function edit(Localization $localization)
    {
        $languages = Localization::distinct()->pluck('language')->sort()->values();
        $groups = Localization::distinct()->whereNotNull('group')->pluck('group')->sort()->values();

        return Inertia::render('Localizations/Edit', [
            'localization' => $localization,
            'languages' => $languages,
            'groups' => $groups,
        ]);
    }

    public function update(UpdateLocalizationRequest $request, Localization $localization)
    {
        $localization->update($request->validated());

        return redirect()->route('localizations.index')
            ->with('success', 'Localization updated successfully.');
    }

    public function destroy(Localization $localization)
    {
        $localization->delete();

        return redirect()->route('localizations.index')
            ->with('success', 'Localization deleted successfully.');
    }

    // API endpoint for frontend translations
    public function getTranslations(Request $request, string $language)
    {
        $translations = Localization::getTranslations($language);
        
        return response()->json($translations);
    }
}

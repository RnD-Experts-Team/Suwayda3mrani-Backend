<?php

namespace App\Http\Controllers;

use App\Exports\EntriesExport;
use App\Models\DisplacedFamily;
use App\Models\Entry;
use App\Models\Host;
use App\Models\Martyr;
use App\Models\Need;
use App\Models\Shelter;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class EntryController extends Controller
{
    public function index(Request $request)
    {
        // Normalize needs parameter to always be an array
        if ($request->has('needs') && !is_array($request->input('needs'))) {
            $request->merge(['needs' => [$request->input('needs')]]);
        }

        $query = Entry::query();

        // Entry number filter
        if ($request->filled('entry_number')) {
            $query->where('entry_number', 'like', "%{$request->entry_number}%");
        }

        // Submitter name filter
        if ($request->filled('submitter_name')) {
            $query->where('submitter_name', 'like', "%{$request->submitter_name}%");
        }

        // Location filter
        if ($request->filled('location') && $request->input('location') !== 'all') {
            if ($request->input('location') === 'no-location') {
                $query->where(function($q) {
                    $q->whereNull('location')->orWhere('location', '');
                });
            } else {
                $query->where('location', $request->input('location'));
            }
        }

        // Status filter
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', 'like', "%{$request->input('status')}%");
        }

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('date_submitted', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date_submitted', '<=', $request->input('date_to'));
        }

        // Combined Needs Filter - handles both predefined and other needs together
        $hasNeedsFilter = $request->filled('needs') && is_array($request->needs) && count($request->needs) > 0;
        $hasOtherNeedsFilter = $request->filled('other_needs') && !empty(trim($request->input('other_needs')));

        if ($hasNeedsFilter || $hasOtherNeedsFilter) {
            $conditions = [];
            $bindings = [];

            // Add regular needs condition if selected
            if ($hasNeedsFilter) {
                $selectedNeeds = array_filter($request->needs);
                if (!empty($selectedNeeds)) {
                    $needsIds = implode(',', array_map('intval', $selectedNeeds));
                    $conditions[] = "(dfn.need_id IN ({$needsIds}) OR dfn2.need_id IN ({$needsIds}))";
                }
            }

            // Add other needs text search condition if provided
            if ($hasOtherNeedsFilter) {
                $otherNeedsText = trim($request->input('other_needs'));
                $conditions[] = "((n.name LIKE 'other%' AND n.name_ar LIKE ?) OR (n2.name LIKE 'other%' AND n2.name_ar LIKE ?))";
                $bindings[] = "%{$otherNeedsText}%";
                $bindings[] = "%{$otherNeedsText}%";
            }

            // Combine conditions with OR logic
            if (!empty($conditions)) {
                $whereCondition = implode(' OR ', $conditions);

                $query->whereRaw("
                    entries.id IN (
                        SELECT DISTINCT e.id FROM entries e
                        LEFT JOIN displaced_families df ON df.entry_id = e.id
                        LEFT JOIN displaced_family_needs dfn ON dfn.displaced_family_id = df.id
                        LEFT JOIN needs n ON n.id = dfn.need_id
                        LEFT JOIN shelters s ON s.entry_id = e.id
                        LEFT JOIN displaced_families df2 ON df2.shelter_id = s.id
                        LEFT JOIN displaced_family_needs dfn2 ON dfn2.displaced_family_id = df2.id
                        LEFT JOIN needs n2 ON n2.id = dfn2.need_id
                        WHERE {$whereCondition}
                    )
                ", $bindings);
            }
        }

        // Needs fulfillment filter
        if ($request->filled('needs_fulfilled') && $request->input('needs_fulfilled') !== 'all') {
            $isFulfilled = $request->input('needs_fulfilled') === 'fulfilled';

            $query->whereRaw("
                entries.id IN (
                    SELECT DISTINCT e.id FROM entries e
                    LEFT JOIN displaced_families df ON df.entry_id = e.id
                    LEFT JOIN displaced_family_needs dfn ON dfn.displaced_family_id = df.id
                    LEFT JOIN shelters s ON s.entry_id = e.id
                    LEFT JOIN displaced_families df2 ON df2.shelter_id = s.id
                    LEFT JOIN displaced_family_needs dfn2 ON dfn2.displaced_family_id = df2.id
                    WHERE dfn.is_fulfilled = ? OR dfn2.is_fulfilled = ?
                )
            ", [$isFulfilled, $isFulfilled]);
        }

        // Family size filter
        if ($request->filled('family_size_min')) {
            $query->whereHas('displacedFamilies', function($q) use ($request) {
                $q->where('individuals_count', '>=', $request->input('family_size_min'));
            });
        }
        if ($request->filled('family_size_max')) {
            $query->whereHas('displacedFamilies', function($q) use ($request) {
                $q->where('individuals_count', '<=', $request->input('family_size_max'));
            });
        }

        // Has children under 8 months filter
        if ($request->filled('has_children') && $request->input('has_children') !== 'all') {
            $hasChildren = $request->input('has_children') === 'yes';
            $childrenValue = $hasChildren ? 'نعم' : 'لا';

            $query->where(function($q) use ($childrenValue) {
                $q->whereHas('displacedFamilies', function($subQ) use ($childrenValue) {
                    $subQ->where('children_under_8_months', $childrenValue);
                })->orWhereHas('host', function($subQ) use ($childrenValue) {
                    $subQ->where('children_under_8_months', $childrenValue);
                });
            });
        }

        // Add counts for display
        $query->withCount([
            'displacedFamilies as hosted_families_count',
            'martyrs as martyrs_count',
            'shelters as shelters_count'
        ]);

        // Get paginated results
        $entries = $query->orderBy('date_submitted', 'desc')
            ->paginate(12)
            ->withQueryString();

        // Get filter options - Include ALL needs (predefined + other)
        $allNeeds = Need::orderBy('name_ar')->get();

        // Separate predefined and custom needs
        $predefinedNeeds = $allNeeds->filter(function($need) {
            return !str_starts_with($need->name, 'other');
        })->values();

        $otherNeeds = $allNeeds->filter(function($need) {
            return str_starts_with($need->name, 'other');
        })->values();

        // Combine both for the dropdown - predefined first, then other needs
        $allNeedsForDropdown = $predefinedNeeds->concat($otherNeeds)->values();

        $allLocations = Entry::select('location')
            ->whereNotNull('location')
            ->where('location', '!=', '')
            ->distinct()
            ->pluck('location')
            ->filter()
            ->sort()
            ->values();

        $allStatuses = Entry::select('status')
            ->whereNotNull('status')
            ->where('status', '!=', '')
            ->distinct()
            ->get()
            ->flatMap(function ($entry) {
                return collect(explode(',', $entry->status))
                    ->map(fn($status) => trim($status))
                    ->filter();
            })
            ->unique()
            ->sort()
            ->values();

        // Debug logging
        \Log::info('Entries Index Response Debug:', [
            'entries_type' => gettype($entries),
            'entries_data_count' => count($entries->items()),
            'total_needs_count' => count($allNeedsForDropdown),
            'predefined_needs_count' => count($predefinedNeeds),
            'other_needs_count' => count($otherNeeds),
            'filters_needs' => $request->input('needs'),
            'filters_other_needs' => $request->input('other_needs'),
        ]);

        return Inertia::render('Entries/Index', [
            'entries' => $entries,
            'needs' => $allNeedsForDropdown->toArray(), // Send all needs including others
            'predefinedNeeds' => $predefinedNeeds->toArray(),
            'otherNeeds' => $otherNeeds->toArray(),
            'locations' => $allLocations,
            'statuses' => $allStatuses,
            'filters' => $request->only([
                'entry_number', 'submitter_name', 'location', 'status', 'needs',
                'other_needs',
                'needs_fulfilled', 'date_from', 'date_to',
                'family_size_min', 'family_size_max', 'has_children'
            ]),
        ]);
    }

    public function show($id)
    {
        // Get all models with their complete relationships
        $entry = Entry::with([
            'host',
            'displacedFamilies.needs',
            'martyrs',
            'shelters.displacedFamilies.needs'
        ])->findOrFail($id);

        // Get all needs for reference (useful for filtering/display)
        $allNeeds = Need::with('displacedFamilies')->get();

        return Inertia::render('Entries/Show', [
            'entry' => $entry,
            'allNeeds' => $allNeeds,
            // Additional statistics for context
            'stats' => [
                'total_displaced_families' => $entry->displacedFamilies->count() +
                    $entry->shelters->sum(function($shelter) {
                        return $shelter->displacedFamilies->count();
                    }),
                'total_needs' => $entry->displacedFamilies->pluck('needs')->flatten()
                    ->merge($entry->shelters->pluck('displacedFamilies')->flatten()->pluck('needs')->flatten())
                    ->unique('id')->count(),
                'fulfilled_needs' => $entry->displacedFamilies->pluck('needs')->flatten()
                    ->merge($entry->shelters->pluck('displacedFamilies')->flatten()->pluck('needs')->flatten())
                    ->where('pivot.is_fulfilled', true)->count(),
            ]
        ]);
    }

    public function export()
    {
        return Excel::download(new EntriesExport(Entry::query()), 'entries-' . now()->format('Y-m-d_H-i-s') . '.xlsx');
    }
}

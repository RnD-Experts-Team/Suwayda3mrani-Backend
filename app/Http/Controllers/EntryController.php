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
        $query = Entry::query();

        // Apply individual filters
        if ($request->filled('entry_number')) {
            $query->where('entry_number', 'like', "%{$request->entry_number}%");
        }

        if ($request->filled('submitter_name')) {
            $query->where('submitter_name', 'like', "%{$request->submitter_name}%");
        }

        if ($request->filled('location') && $request->input('location') !== 'all') {
            if ($request->input('location') === 'no-location') {
                $query->where(function($q) {
                    $q->whereNull('location')->orWhere('location', '');
                });
            } else {
                $query->where('location', $request->input('location'));
            }
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', 'like', "%{$request->input('status')}%");
        }

        // Simple OR-based needs filter
        if ($request->filled('needs') && is_array($request->needs) && count($request->needs) > 0) {
            $selectedNeeds = array_filter($request->needs);

            if (!empty($selectedNeeds)) {
                $needsIds = implode(',', array_map('intval', $selectedNeeds));

                $query->whereRaw("
                entries.id IN (
                    SELECT DISTINCT e.id FROM entries e
                    LEFT JOIN displaced_families df ON df.entry_id = e.id
                    LEFT JOIN displaced_family_needs dfn ON dfn.displaced_family_id = df.id
                    LEFT JOIN shelters s ON s.entry_id = e.id
                    LEFT JOIN displaced_families df2 ON df2.shelter_id = s.id
                    LEFT JOIN displaced_family_needs dfn2 ON dfn2.displaced_family_id = df2.id
                    WHERE dfn.need_id IN ({$needsIds}) OR dfn2.need_id IN ({$needsIds})
                )
            ");
            }
        }
        // Add counts
        $query->withCount([
            'displacedFamilies as hosted_families_count',
            'martyrs as martyrs_count',
            'shelters as shelters_count'
        ]);

        $entries = $query->orderBy('date_submitted', 'desc')
            ->paginate(9)
            ->withQueryString();

        $allNeeds = Need::orderBy('name_ar')->get();

        return inertia('Entries/Index', [
            'entries' => $entries,
            'needs' => $allNeeds,
            'filters' => $request->only(['entry_number', 'submitter_name', 'location', 'status', 'needs']),
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

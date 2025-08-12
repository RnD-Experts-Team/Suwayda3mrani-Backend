<?php

namespace App\Http\Controllers;

use App\Exports\EntriesExport;
use App\Models\Entry;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class EntryController extends Controller
{
    public function index(Request $request)
    {
        $query = Entry::query();

        // Apply filters only if they're provided and not empty
        if ($request->filled('entry_number')) {
            $query->where('entry_number', 'like', "%{$request->entry_number}%");
        }
        if ($request->filled('submitter_name')) {
            $query->where('submitter_name', 'like', "%{$request->submitter_name}%");
        }
        if ($request->filled('location') && $request->input('location') !== 'all') {
            if ($request->input('location') === 'no-location') {
                $query->whereNull('location')->orWhere('location', '');
            } else {
                $query->where('location', $request->input('location'));
            }
        }
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', 'like', "%{$request->input('status')}%");
        }

        $entries = $query->orderBy('date_submitted', 'desc')
            ->paginate(9)
            ->withQueryString();

        return inertia('Entries/Index', [
            'entries' => $entries,
            'filters' => $request->only(['entry_number', 'submitter_name', 'location', 'status']),
        ]);
    }

    public function show($id)
    {
        $entry = Entry::with([
            'host',
            'hostedFamilies',
            'martyrs',
            'shelters.displacedFamilies'
        ])->findOrFail($id);

        return Inertia::render('Entries/Show', [
            'entry' => $entry
        ]);
    }

    public function export()
    {
        return Excel::download(new EntriesExport(Entry::query()), 'entries-' . now()->format('Y-m-d_H-i-s') . '.xlsx');
    }
}

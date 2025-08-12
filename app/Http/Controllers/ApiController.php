<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Entry;

class ApiController extends Controller
{
    public function getEntries()
    {
        $entries = Entry::with(['host', 'hostedFamilies', 'martyrs', 'shelters.displacedFamilies'])->get();
        return response()->json($entries);
    }

    public function getEntry($id)
    {
        $entry = Entry::with(['host', 'hostedFamilies', 'martyrs', 'shelters.displacedFamilies'])->findOrFail($id);
        return response()->json($entry);
    }
}

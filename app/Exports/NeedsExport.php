<?php

namespace App\Exports;

use App\Models\Need;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class NeedsExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        $sheets = [];

        // Get all predefined needs (not starting with 'other_')
        $predefinedNeeds = Need::where('name', 'not like', 'other_%')
            ->orderBy('name_ar')
            ->get();

        // Create a sheet for each predefined need using Arabic name
        foreach ($predefinedNeeds as $need) {
            // Clean the sheet name for Excel compatibility
            $sheetName = $this->cleanSheetName($need->name_ar);
            $sheets[$sheetName] = new NeedSheetExport($need->id, $need->name_ar);
        }

        // Add one sheet for all "other" needs in Arabic
        $otherSheetName = $this->cleanSheetName('احتياجات أخرى');
        $sheets[$otherSheetName] = new OtherNeedsSheetExport();

        return $sheets;
    }

    /**
     * Clean sheet name for Excel compatibility
     * Excel sheet names cannot contain: : \ / ? * [ ]
     * And must be 31 characters or less
     */
    private function cleanSheetName($name)
    {
        // Remove invalid characters
        $cleaned = str_replace([':', '\\', '/', '?', '*', '[', ']'], '', $name);

        // Limit to 31 characters (Excel limit)
        if (strlen($cleaned) > 31) {
            $cleaned = mb_substr($cleaned, 0, 31, 'UTF-8');
        }

        return trim($cleaned);
    }
}

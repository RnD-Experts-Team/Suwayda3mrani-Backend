<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class EntriesExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            'الدخولات' => new EntriesSheetExport(),           // Entries
            'المضيفين' => new HostsSheetExport(),             // Hosts
            'الشهداء' => new MartyrsSheetExport(),            // Martyrs
            'مراكز الاستضافة' => new SheltersSheetExport(),           // Shelters
            'العائلات النازحة' => new DisplacedFamiliesSheetExport(), // Displaced Families
        ];
    }
}

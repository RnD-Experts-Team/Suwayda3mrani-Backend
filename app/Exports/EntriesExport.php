<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class EntriesExport implements WithMultipleSheets
{
    public function sheets(): array
    {
        return [
            'Entries' => new EntriesSheetExport(),
            'Hosts' => new HostsSheetExport(),
            'Martyrs' => new MartyrsSheetExport(),
            'Shelters' => new SheltersSheetExport(),
            'Displaced Families' => new DisplacedFamiliesSheetExport(),
        ];
    }
}

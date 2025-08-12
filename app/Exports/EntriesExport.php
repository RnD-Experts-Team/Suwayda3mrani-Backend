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
            'Hosted Families' => new HostedFamiliesSheetExport(),
            'Martyrs' => new MartyrsSheetExport(),
            'Shelters' => new SheltersSheetExport(),
            'Displaced Families' => new DisplacedFamiliesSheetExport(),
        ];
    }
}

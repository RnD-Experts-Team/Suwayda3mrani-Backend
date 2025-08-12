<?php

namespace App\Exports;

use App\Models\Host;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class HostsSheetExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Host::with('entry')->get();
    }

    public function headings(): array
    {
        return [
            'Entry ID',
            'Full Name',
            'Family Count',
            'Location',
            'Address',
            'Phone',
            'Family Book Number',
        ];
    }

    public function map($host): array
    {
        return [
            $host->entry_id,
            $host->full_name ?? 'N/A',
            $host->family_count ?? 0,
            $host->location ?? 'N/A',
            $host->address ?? 'N/A',
            $host->phone ?? 'N/A',
            $host->family_book_number ?? 'N/A',
        ];
    }
}

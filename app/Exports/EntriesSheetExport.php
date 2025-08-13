<?php

namespace App\Exports;

use App\Models\Entry;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Concerns\WithStyles;

class EntriesSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function collection()
    {
        return Entry::with([
            'host',
            'displacedFamilies', // Changed from hostedFamilies
            'martyrs',
            'shelters.displacedFamilies'
        ])->get();
    }

    public function headings(): array
    {
        return [
            'Entry ID',
            'Entry Number',
            'Submitter Name',
            'Location',
            'Status',
            'Date Submitted',
            'Host Name',
            'Host Family Count',
            'Host Location',
            'Displaced Families Count',
            'Martyrs Count',
            'Shelters Count',
            'Internal Link',
        ];
    }

    public function map($entry): array
    {
        return [
            $entry->id,
            $entry->entry_number,
            $entry->submitter_name,
            $entry->location,
            $entry->status,
            $entry->date_submitted,
            $entry->host->full_name ?? 'N/A',
            $entry->host->family_count ?? 'N/A',
            $entry->host->location ?? 'N/A',
            $entry->displacedFamilies->count(), // Changed from hostedFamilies
            $entry->martyrs->count(),
            $entry->shelters->count(),
            $entry->InternalLink,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the first row as bold text
            1 => ['font' => ['bold' => true]],
        ];
    }
}

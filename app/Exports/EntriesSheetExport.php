<?php

namespace App\Exports;

use App\Models\Entry;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class EntriesSheetExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Entry::withCount(['hostedFamilies', 'martyrs', 'shelters'])->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Entry Number',
            'Submitter Name',
            'Location',
            'Status',
            'Date Submitted',
            'Hosted Families Count',
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
            $entry->submitter_name ?? 'N/A',
            $entry->location ?? 'N/A',
            $entry->status ?? 'N/A',
            $entry->date_submitted,
            $entry->hosted_families_count,
            $entry->martyrs_count,
            $entry->shelters_count,
            $entry->InternalLink ?? 'N/A',
        ];
    }
}

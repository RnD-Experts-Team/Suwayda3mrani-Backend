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
            'displacedFamilies.needs',
            'martyrs',
            'shelters.displacedFamilies.needs'
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
            'Host Children Under 8 Months',
            'Displaced Families Count',
            'Total Needs Count',
            'Unique Needs Types',
            'Martyrs Count',
            'Shelters Count',
            'Internal Link',
        ];
    }

    public function map($entry): array
    {
        // Calculate total needs across all displaced families
        $allNeeds = collect();

        // Add needs from direct displaced families
        foreach ($entry->displacedFamilies as $family) {
            $allNeeds = $allNeeds->merge($family->needs);
        }

        // Add needs from shelter displaced families
        foreach ($entry->shelters as $shelter) {
            foreach ($shelter->displacedFamilies as $family) {
                $allNeeds = $allNeeds->merge($family->needs);
            }
        }

        $uniqueNeeds = $allNeeds->unique('id')->pluck('name_ar');

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
            $this->translateBoolean($entry->host->children_under_8_months ?? null),
            $entry->displacedFamilies->count() + $entry->shelters->sum(function($shelter) {
                return $shelter->displacedFamilies->count();
            }),
            $allNeeds->count(),
            $uniqueNeeds->implode(', ') ?: 'N/A',
            $entry->martyrs->count(),
            $entry->shelters->count(),
            $entry->InternalLink,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    private function translateBoolean($value): string
    {
        if ($value === 'نعم') return 'Yes';
        if ($value === 'لا') return 'No';
        return $value ?? 'N/A';
    }
}

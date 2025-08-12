<?php

namespace App\Exports;

use App\Models\HostedFamily;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class HostedFamiliesSheetExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return HostedFamily::with('entry')->get();
    }

    public function headings(): array
    {
        return [
            'Entry ID',
            'Individuals Count',
            'Contact',
            'Wife Name',
            'Children Info',
            'Needs',
            'Assistance Type',
            'Provider',
            'Date Received',
            'Notes',
            'Return Possible',
            'Previous Assistance',
            'Images',
            'Family Book Number',
        ];
    }

    public function map($family): array
    {
        return [
            $family->entry_id,
            $family->individuals_count ?? 'N/A',
            $family->contact ?? 'N/A',
            $family->wife_name ?? 'N/A',
            $family->children_info ?? 'N/A',
            $family->needs ?? 'N/A',
            $family->assistance_type ?? 'N/A',
            $family->provider ?? 'N/A',
            $family->date_received ?? 'N/A',
            $family->notes ?? 'N/A',
            $family->return_possible ?? 'N/A',
            $family->previous_assistance ?? 'N/A',
            $family->images ?? 'N/A',
            $family->family_book_number ?? 'N/A',
        ];
    }
}

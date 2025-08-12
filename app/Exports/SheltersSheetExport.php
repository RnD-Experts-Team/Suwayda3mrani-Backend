<?php

namespace App\Exports;

use App\Models\Shelter;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class SheltersSheetExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Shelter::with('entry')->get();
    }

    public function headings(): array
    {
        return [
            'Entry ID',
            'Place',
            'Contact',
            'Images',
        ];
    }

    public function map($shelter): array
    {
        return [
            $shelter->entry_id,
            $shelter->place ?? 'N/A',
            $shelter->contact ?? 'N/A',
            $shelter->images ?? 'N/A',
        ];
    }
}

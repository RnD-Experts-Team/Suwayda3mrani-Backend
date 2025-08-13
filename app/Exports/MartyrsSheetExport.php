<?php

namespace App\Exports;

use App\Models\Martyr;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class MartyrsSheetExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Martyr::with('entry')->get();
    }

    public function headings(): array
    {
        return [
            'Entry ID',
            'Name',
            'Age',
            'Place',
            'Relative Contact',
            'Images',
        ];
    }

    public function map($martyr): array
    {
        return [
            $martyr->entry_id,
            $martyr->name ?? 'N/A',
            $martyr->age ?? 0,
            $martyr->place ?? 'N/A',
            $martyr->relative_contact ?? 'N/A',
            $martyr->images ?? 'N/A',
        ];
    }
}

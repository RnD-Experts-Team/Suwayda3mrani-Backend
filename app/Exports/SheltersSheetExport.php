<?php

namespace App\Exports;

use App\Models\Shelter;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SheltersSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    public function title(): string
    {
        return 'مراكز الاستضافة';
    }

    public function collection()
    {
        return Shelter::with(['entry', 'displacedFamilies'])->get();
    }

    public function headings(): array
    {
        return [
            'رقم الدخول الفريد',        // Entry ID
            'رقم الدخول',             // Entry Number
            'مكان مركز الاستضافة',             // Shelter Place
            'جهة اتصال مركز الاستضافة',        // Shelter Contact
            'عدد العائلات النازحة',      // Number of Displaced Families
            'تاريخ الإنشاء',           // Created At
        ];
    }

    public function map($shelter): array
    {
        return [
            $shelter->entry_id,
            $shelter->entry->entry_number ?? 'غير محدد',
            $shelter->place ?? 'غير محدد',
            $shelter->contact ?? 'غير محدد',
            $shelter->displacedFamilies->count(),
            $shelter->created_at ? $shelter->created_at->format('Y-m-d H:i:s') : 'غير محدد',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

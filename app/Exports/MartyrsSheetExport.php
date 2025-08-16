<?php

namespace App\Exports;

use App\Models\Martyr;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class MartyrsSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    public function title(): string
    {
        return 'الشهداء';
    }

    public function collection()
    {
        return Martyr::with('entry')->get();
    }

    public function headings(): array
    {
        return [
            'رقم الدخول الفريد',        // Entry ID
            'رقم الدخول',             // Entry Number
            'اسم الشهيد',              // Martyr Name
            'عمر الشهيد',              // Age
            'مكان الاستشهاد',          // Place of Martyrdom
            'جهة اتصال الأقارب',       // Relative Contact
            'تاريخ الإنشاء',           // Created At
        ];
    }

    public function map($martyr): array
    {
        return [
            $martyr->entry_id,
            $martyr->entry->entry_number ?? 'غير محدد',
            $martyr->name ?? 'غير محدد',
            $martyr->age ?? 'غير محدد',
            $martyr->place ?? 'غير محدد',
            $martyr->relative_contact ?? 'غير محدد',
            $martyr->created_at ? $martyr->created_at->format('Y-m-d H:i:s') : 'غير محدد',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}

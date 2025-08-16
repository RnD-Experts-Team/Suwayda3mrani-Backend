<?php

namespace App\Exports;

use App\Models\Host;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class HostsSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    public function title(): string
    {
        return 'المضيفين';
    }

    public function collection()
    {
        return Host::with('entry')->get();
    }

    public function headings(): array
    {
        return [
            'رقم الدخول الفريد',        // Entry ID
            'رقم الدخول',             // Entry Number
            'الاسم الكامل للمضيف',     // Full Name
            'عدد أفراد عائلة المضيف',   // Family Count
            'مكان المضيف',            // Location
            'عنوان المضيف',           // Address
            'رقم هاتف المضيف',        // Phone
            'أطفال دون 8 أشهر لدى المضيف', // Children Under 8 Months
            'تفاصيل الولادة',          // Birth Details
            'رقم دفتر العائلة',        // Family Book Number
            'تاريخ الإنشاء',           // Created At
        ];
    }

    public function map($host): array
    {
        return [
            $host->entry_id,
            $host->entry->entry_number ?? 'غير محدد',
            $host->full_name ?? 'غير محدد',
            $this->formatText($host->family_count) ?: 0,
            $host->location ?? 'غير محدد',
            $host->address ?? 'غير محدد',
            $host->phone ?? 'غير محدد',
            $this->translateBoolean($host->children_under_8_months),
            $this->formatText($host->birth_details),
            $host->family_book_number ?? 'غير محدد',
            $host->created_at ? $host->created_at->format('Y-m-d H:i:s') : 'غير محدد',
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
        if ($value === 'نعم') return 'نعم';
        if ($value === 'لا') return 'لا';
        return $value ?? 'غير محدد';
    }

    private function formatText($text): string
    {
        if (empty($text)) {
            return 'غير محدد';
        }
        return str_replace(["\n", "\r"], ' ', $text);
    }
}

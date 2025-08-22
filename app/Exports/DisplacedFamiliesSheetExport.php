<?php

namespace App\Exports;

use App\Models\DisplacedFamily;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DisplacedFamiliesSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    public function title(): string
    {
        return 'العائلات النازحة';
    }

    public function collection()
    {
        return DisplacedFamily::with(['shelter.entry.host', 'entry.host', 'needs'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'رقم العائلة',             // Family ID
            'مرتبطة بـ',               // Associated With
            'رقم الدخول',             // Entry Number
            'مكان الاستضافة',             // Shelter Location
            'اسم المضيف',              // Host Name
            'موقع المضيف',            // Host Location
            'عنوان المضيف',           // Host Address
            'هاتف المضيف',            // Host Phone
            'عدد أفراد عائلة المضيف',   // Host Family Count
            'عدد أفراد العائلة',        // Individuals Count
            'جهة اتصال رب العائلة',     // Family Head Contact
            'اسم الزوجة',              // Wife Name
            'معلومات الأطفال',         // Children Info
            'احتياجات العائلة',         // Family Needs
            'حالة الاحتياجات',          // Needs Status
            'نوع المساعدة',            // Assistance Type
            'مقدم المساعدة',           // Assistance Provider
            'تاريخ استلام المساعدة',     // Date Received
            'إمكانية العودة',          // Return Possible?
            'مساعدة سابقة',            // Previous Assistance?
            'رقم دفتر العائلة',        // Family Book Number
            'أطفال دون 8 أشهر',        // Children Under 8 Months
            'تفاصيل الولادة',          // Birth Details
            'ملاحظات',               // Notes
            'تاريخ الإنشاء',           // Created At
            'عدد الصور',              // Images Count
        ];
    }

    public function map($family): array
    {
        // Get host information - check both shelter->entry->host and direct entry->host
        $host = null;
        if ($family->shelter && $family->shelter->entry && $family->shelter->entry->host) {
            $host = $family->shelter->entry->host;
        } elseif ($family->entry && $family->entry->host) {
            $host = $family->entry->host;
        }

        return [
            $family->id,
            $family->shelter_id ? 'مركز استضافة' : ($family->entry_id ? 'عائلة مضيفة' : 'غير محدد'),
            $family->shelter->entry->entry_number ?? ($family->entry->entry_number ?? 'غير محدد'),
            $family->shelter->place ?? 'غير محدد',
            $host->full_name ?? 'غير محدد',
            $host->location ?? 'غير محدد',
            $host->address ?? 'غير محدد',
            $host->phone ?? 'غير محدد',
            $host->family_count ?? 'غير محدد',
            $family->individuals_count ?? 'غير محدد',
            $family->contact ?? 'غير محدد',
            $family->wife_name ?? 'غير محدد',
            $this->formatText($family->children_info),
            $this->formatNeeds($family->needs),
            $this->formatNeedsStatus($family->needs),
            $family->assistance_type ?? 'غير محدد',
            $family->provider ?? 'غير محدد',
            $family->date_received ?? 'غير محدد',
            $this->translateBoolean($family->return_possible),
            $this->translateBoolean($family->previous_assistance),
            $family->family_book_number ?? 'غير محدد',
            $this->translateBoolean($family->children_under_8_months),
            $this->formatText($family->birth_details),
            $this->formatText($family->notes),
            $family->created_at ? $family->created_at->format('Y-m-d H:i:s') : 'غير محدد',
            $this->countImages($family->images),
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    private function formatText($text): string
    {
        if (empty($text)) {
            return 'غير محدد';
        }
        return str_replace(["\n", "\r"], ' ', $text);
    }

    private function formatNeeds($needs): string
    {
        if (!$needs || $needs->isEmpty()) {
            return 'غير محدد';
        }

        return $needs->pluck('name_ar')->implode('، ');
    }

    private function formatNeedsStatus($needs): string
    {
        if (!$needs || $needs->isEmpty()) {
            return 'غير محدد';
        }

        $status = [];
        foreach ($needs as $need) {
            $fulfilled = $need->pivot->is_fulfilled ? 'مُلبى' : 'معلق';
            $status[] = $need->name_ar . ': ' . $fulfilled;
        }

        return implode('؛ ', $status);
    }

    private function translateBoolean($value): string
    {
        if ($value === 'نعم') return 'نعم';
        if ($value === 'لا') return 'لا';
        return $value ?? 'غير محدد';
    }

    private function countImages($images): int
    {
        if (empty($images)) {
            return 0;
        }

        if (is_string($images)) {
            $images = json_decode($images, true);
        }

        if (is_array($images)) {
            return count($images);
        }

        return 0;
    }
}

<?php

namespace App\Exports;

use App\Models\Need;
use App\Models\DisplacedFamily;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class OtherNeedsSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    public function title(): string
    {
        return 'احتياجات أخرى';
    }

    public function collection()
    {
        // Get all displaced families that have "other" needs
        return DisplacedFamily::with([
            'entry.host',
            'shelter.entry.host',
            'needs' => function($query) {
                $query->where('name', 'like', 'other_%');
            }
        ])
            ->whereHas('needs', function($query) {
                $query->where('name', 'like', 'other_%');
            })
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'اسم الاحتياج',      // Need Name
            'الاسم الكامل',      // Full Name (from Host)
            'رقم الهاتف',        // Phone (from Host)
            'جهة الاتصال',       // Contact (from DisplacedFamily - father name and number)
            'العنوان',          // Address (from Host)
            'عدد أفراد العائلة',   // Family Count (from DisplacedFamily)
            'رقم الدخول',        // Entry Number
            'اسم الزوجة',        // Wife Name (from DisplacedFamily)
            'معلومات الأطفال',    // Children Info (from DisplacedFamily)
            'تاريخ الإنشاء',      // Created Date
        ];
    }

    public function map($family): array
    {
        // Get host info from entry (either direct entry or through shelter)
        $host = null;
        $entry = null;

        if ($family->entry_id) {
            // Direct family under entry
            $entry = $family->entry;
            $host = $entry->host;
        } elseif ($family->shelter_id && $family->shelter->entry) {
            // Family under shelter
            $entry = $family->shelter->entry;
            $host = $entry->host;
        }

        // Get all "other" needs for this family
        $otherNeeds = $family->needs
            ->filter(function($need) {
                return substr($need->name, 0, 5) === 'other';
            })
            ->pluck('name_ar')
            ->implode('، '); // Arabic comma separator
        return [
            $otherNeeds ?: 'غير محدد',
            $host->full_name ?? 'غير محدد',
            $host->phone ?? 'غير محدد',
            $family->contact ?? 'غير محدد',
            $host->address ?? 'غير محدد',
            $family->individuals_count ?? 0,
            $entry->entry_number ?? 'غير محدد',
            $family->wife_name ?? 'غير محدد',
            $this->formatText($family->children_info),
            $family->created_at ? $family->created_at->format('Y-m-d H:i') : 'غير محدد',
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
}

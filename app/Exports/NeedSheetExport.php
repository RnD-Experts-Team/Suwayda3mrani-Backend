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

class NeedSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    private $needId;
    private $needName;

    public function __construct($needId, $needName = null)
    {
        $this->needId = $needId;
        $this->needName = $needName;
    }

    public function title(): string
    {
        if ($this->needName) {
            return $this->cleanSheetName($this->needName);
        }

        $need = Need::find($this->needId);
        return $need ? $this->cleanSheetName($need->name_ar) : 'غير محدد';
    }

    public function collection()
    {
        // Get all displaced families that have this specific need
        return DisplacedFamily::with([
            'entry.host',
            'shelter.entry.host',
            'needs' => function($query) {
                $query->where('need_id', $this->needId);
            }
        ])
            ->whereHas('needs', function($query) {
                $query->where('need_id', $this->needId);
            })
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'اسم الاحتياج',      // Need Name
            'الاسم المضيف',      // Full Name (from Host)
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
        $need = Need::find($this->needId);

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

        return [
            $need ? $need->name_ar : 'غير محدد',
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

    private function cleanSheetName($name)
    {
        // Remove invalid characters for Excel sheet names
        $cleaned = str_replace([':', '\\', '/', '?', '*', '[', ']'], '', $name);

        // Limit to 31 characters (Excel limit)
        if (strlen($cleaned) > 31) {
            $cleaned = mb_substr($cleaned, 0, 31, 'UTF-8');
        }

        return trim($cleaned);
    }
}

<?php

namespace App\Exports;

use App\Models\Entry;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EntriesSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle
{
    public function title(): string
    {
        return 'الدخولات';
    }

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
            'رقم الدخول الفريد',        // Entry ID
            'رقم الدخول',             // Entry Number
            'اسم المرسل',              // Submitter Name
            'الموقع',                 // Location
            'الحالة',                 // Status
            'تاريخ الإرسال',           // Date Submitted
            'اسم المضيف',             // Host Name
            'عدد أفراد عائلة المضيف',   // Host Family Count
            'مكان المضيف',            // Host Location
            'أطفال دون 8 أشهر لدى المضيف', // Host Children Under 8 Months
            'عدد العائلات النازحة',      // Displaced Families Count
            'إجمالي عدد الاحتياجات',     // Total Needs Count
            'أنواع الاحتياجات',         // Unique Needs Types
            'عدد الشهداء',             // Martyrs Count
            'عدد الملاجئ',             // Shelters Count
            'الرابط الداخلي',          // Internal Link
            'تاريخ الإنشاء',           // Created At
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
            $entry->submitter_name ?? 'غير محدد',
            $entry->location ?? 'غير محدد',
            $entry->status ?? 'غير محدد',
            $entry->date_submitted ? $entry->date_submitted->format('Y-m-d H:i:s') : 'غير محدد',
            $entry->host->full_name ?? 'غير محدد',
            $this->formatText($entry->host->family_count ?? 'غير محدد'),
            $entry->host->location ?? 'غير محدد',
            $this->translateBoolean($entry->host->children_under_8_months ?? null),
            $entry->displacedFamilies->count() + $entry->shelters->sum(function($shelter) {
                return $shelter->displacedFamilies->count();
            }),
            $allNeeds->count(),
            $uniqueNeeds->implode('، ') ?: 'غير محدد',
            $entry->martyrs->count(),
            $entry->shelters->count(),
            $entry->InternalLink ?? 'غير محدد',
            $entry->created_at ? $entry->created_at->format('Y-m-d H:i:s') : 'غير محدد',
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

<?php

namespace App\Exports;

use App\Models\DisplacedFamily;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class DisplacedFamiliesSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function collection()
    {
        return DisplacedFamily::with(['shelter.entry', 'entry', 'needs'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Associated With',
            'Entry Number',
            'Shelter Location',
            'Individuals Count',
            'Family Head Contact',
            'Wife Name',
            'Children Info',
            'Family Needs',
            'Needs Status',
            'Assistance Type',
            'Assistance Provider',
            'Date Received',
            'Return Possible?',
            'Previous Assistance?',
            'Family Book Number',
            'Children Under 8 Months',
            'Birth Details',
            'Notes',
            'Created At',
            'Images Count',
        ];
    }

    public function map($family): array
    {
        return [
            $family->id,
            $family->shelter_id ? 'Shelter' : ($family->entry_id ? 'Entry' : 'N/A'),
            $family->shelter->entry->entry_number ?? ($family->entry->entry_number ?? 'N/A'),
            $family->shelter->place ?? 'N/A',
            $family->individuals_count ?? 'N/A',
            $family->contact ?? 'N/A',
            $family->wife_name ?? 'N/A',
            $this->formatText($family->children_info),
            $this->formatNeeds($family->needs),
            $this->formatNeedsStatus($family->needs),
            $family->assistance_type ?? 'N/A',
            $family->provider ?? 'N/A',
            $family->date_received ?? 'N/A',
            $this->translateBoolean($family->return_possible),
            $this->translateBoolean($family->previous_assistance),
            $family->family_book_number ?? 'N/A',
            $this->translateBoolean($family->children_under_8_months),
            $this->formatText($family->birth_details),
            $this->formatText($family->notes),
            $family->created_at->format('Y-m-d H:i:s'),
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
            return 'N/A';
        }
        return str_replace(["\n", "\r"], ' ', $text);
    }

    private function formatNeeds($needs): string
    {
        if (!$needs || $needs->isEmpty()) {
            return 'N/A';
        }

        return $needs->pluck('name_ar')->implode(', ');
    }

    private function formatNeedsStatus($needs): string
    {
        if (!$needs || $needs->isEmpty()) {
            return 'N/A';
        }

        $status = [];
        foreach ($needs as $need) {
            $fulfilled = $need->pivot->is_fulfilled ? 'Fulfilled' : 'Pending';
            $status[] = $need->name_ar . ': ' . $fulfilled;
        }

        return implode('; ', $status);
    }

    private function translateBoolean($value): string
    {
        if ($value === 'نعم') return 'Yes';
        if ($value === 'لا') return 'No';
        return $value ?? 'N/A';
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

<?php

namespace App\Exports;

use App\Models\Host;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class HostsSheetExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    public function collection()
    {
        return Host::with('entry')->get();
    }

    public function headings(): array
    {
        return [
            'Entry ID',
            'Entry Number',
            'Full Name',
            'Family Count',
            'Location',
            'Address',
            'Phone',
            'Children Under 8 Months',
            'Birth Details',
            'Family Book Number',
            'Created At',
        ];
    }

    public function map($host): array
    {
        return [
            $host->entry_id,
            $host->entry->entry_number ?? 'N/A',
            $host->full_name ?? 'N/A',
            $host->family_count ?? 0,
            $host->location ?? 'N/A',
            $host->address ?? 'N/A',
            $host->phone ?? 'N/A',
            $this->translateBoolean($host->children_under_8_months),
            $this->formatText($host->birth_details),
            $host->family_book_number ?? 'N/A',
            $host->created_at->format('Y-m-d H:i:s'),
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
        if ($value === 'نعم') return 'Yes';
        if ($value === 'لا') return 'No';
        return $value ?? 'N/A';
    }

    private function formatText($text): string
    {
        if (empty($text)) {
            return 'N/A';
        }
        return str_replace(["\n", "\r"], ' ', $text);
    }
}

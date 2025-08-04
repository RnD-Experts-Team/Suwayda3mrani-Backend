<?php
// database/seeders/CasesSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Cases;
use App\Models\CaseDetail;
use App\Models\Localization;
use Illuminate\Support\Str;

class CasesSeeder extends Seeder
{
    public function run()
    {
        $caseTypes = ['deaths', 'houses', 'migrations', 'thefts'];
        $locations = ['Village A', 'Village B', 'City C', 'Town D', 'District E'];
        
        foreach ($caseTypes as $type) {
            for ($i = 1; $i <= 5; $i++) {
                $caseId = "case-{$type}-" . date('Y') . '-' . str_pad($i, 3, '0', STR_PAD_LEFT);
                $titleKey = 'case_title_' . $type . '_' . $i . '_' . time();
                $descriptionKey = 'case_desc_' . $type . '_' . $i . '_' . time();
                
                // Create localizations
                foreach (['en', 'ar'] as $lang) {
                    Localization::create([
                        'key' => $titleKey,
                        'language' => $lang,
                        'value' => $lang === 'en' ? ucfirst($type) . " Case {$i}" : "حالة " . $this->getArabicType($type) . " {$i}",
                        'group' => 'cases',
                        'is_active' => true,
                    ]);
                    
                    Localization::create([
                        'key' => $descriptionKey,
                        'language' => $lang,
                        'value' => $lang === 'en' ? "Detailed description of {$type} case {$i}. This case documents important events and provides crucial information for understanding the impact." : "وصف مفصل لحالة {$type} {$i}. تُوثق هذه الحالة أحداثاً مهمة وتوفر معلومات حاسمة لفهم التأثير.",
                        'group' => 'cases',
                        'is_active' => true,
                    ]);
                }
                
                // Create case
                $case = Cases::create([
                    'case_id' => $caseId,
                    'type' => $type,
                    'title_key' => $titleKey,
                    'description_key' => $descriptionKey,
                    'url_slug' => Str::slug($caseId),
                    'external_url' => "https://example.com/{$caseId}",
                    'incident_date' => now()->subDays(rand(30, 365)),
                    'location' => $locations[array_rand($locations)],
                    'is_active' => true,
                    'is_featured' => $i <= 2,
                    'sort_order' => $i,
                ]);
                
                // Add case details
                $this->addCaseDetails($case, $type, $i);
            }
        }
    }
    
    private function addCaseDetails($case, $type, $caseNumber)
    {
        $details = $this->getDetailsForType($type, $caseNumber);
        
        foreach ($details as $index => $detail) {
            $keyLocalizationKey = "case_detail_key_{$case->id}_{$index}_" . time();
            $valueLocalizationKey = "case_detail_value_{$case->id}_{$index}_" . time();
            
            // Create localizations
            foreach (['en', 'ar'] as $lang) {
                Localization::create([
                    'key' => $keyLocalizationKey,
                    'language' => $lang,
                    'value' => $detail['key'][$lang],
                    'group' => 'case_details',
                    'is_active' => true,
                ]);
                
                Localization::create([
                    'key' => $valueLocalizationKey,
                    'language' => $lang,
                    'value' => $detail['value'][$lang],
                    'group' => 'case_details',
                    'is_active' => true,
                ]);
            }
            
            CaseDetail::create([
                'case_id' => $case->id,
                'key_localization_key' => $keyLocalizationKey,
                'value_localization_key' => $valueLocalizationKey,
                'sort_order' => $index,
            ]);
        }
    }
    
    private function getDetailsForType($type, $caseNumber)
    {
        $commonDetails = [
            [
                'key' => ['en' => 'Location', 'ar' => 'الموقع'],
                'value' => ['en' => "Village " . chr(65 + $caseNumber), 'ar' => "القرية " . $this->getArabicLetter($caseNumber)]
            ],
            [
                'key' => ['en' => 'Date', 'ar' => 'التاريخ'],
                'value' => ['en' => now()->subDays(rand(30, 365))->format('Y-m-d'), 'ar' => now()->subDays(rand(30, 365))->format('Y-m-d')]
            ]
        ];
        
        $specificDetails = [];
        switch ($type) {
            case 'deaths':
                $specificDetails[] = [
                    'key' => ['en' => 'Cause', 'ar' => 'السبب'],
                    'value' => ['en' => 'Conflict related', 'ar' => 'متعلق بالنزاع']
                ];
                break;
            case 'houses':
                $specificDetails[] = [
                    'key' => ['en' => 'Damage Level', 'ar' => 'مستوى الضرر'],
                    'value' => ['en' => 'Completely destroyed', 'ar' => 'مدمر بالكامل']
                ];
                break;
            case 'migrations':
                $specificDetails[] = [
                    'key' => ['en' => 'Destination', 'ar' => 'الوجهة'],
                    'value' => ['en' => 'Neighboring country', 'ar' => 'البلد المجاور']
                ];
                break;
            case 'thefts':
                $specificDetails[] = [
                    'key' => ['en' => 'Items Stolen', 'ar' => 'الأشياء المسروقة'],
                    'value' => ['en' => 'Household items and documents', 'ar' => 'أدوات منزلية ووثائق']
                ];
                break;
        }
        
        return array_merge($commonDetails, $specificDetails);
    }
    
    private function getArabicType($type)
    {
        $types = [
            'deaths' => 'وفيات',
            'houses' => 'منازل',
            'migrations' => 'هجرات',
            'thefts' => 'سرقات'
        ];
        return $types[$type] ?? $type;
    }
    
    private function getArabicLetter($number)
    {
        $letters = ['أ', 'ب', 'ج', 'د', 'هـ'];
        return $letters[$number - 1] ?? 'أ';
    }
}

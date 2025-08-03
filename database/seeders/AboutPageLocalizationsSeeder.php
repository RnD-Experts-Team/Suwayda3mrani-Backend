<?php
// database/seeders/AboutPageLocalizationsSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Localization;

class AboutPageLocalizationsSeeder extends Seeder
{
    public function run()
    {
        $localizations = [
            // About Section
            [
                'key' => 'about_section_title',
                'group' => 'about_page',
                'en' => 'About the Crisis Archive',
                'ar' => 'حول أرشيف الأزمة',
            ],
            [
                'key' => 'about_section_description',
                'group' => 'about_page',
                'en' => 'The Crisis Archive is dedicated to documenting and preserving the historical record of the mass atrocities committed against the religious minority group in the region. This archive serves as a critical resource for researchers, educators, policymakers, and the public, aiming to promote understanding, accountability, and prevention of future atrocities.',
                'ar' => 'يُكرس أرشيف الأزمة لتوثيق وحفظ السجل التاريخي للفظائع الجماعية المرتكبة ضد الأقلية الدينية في المنطقة. يُعتبر هذا الأرشيف مصدراً حيوياً للباحثين والمعلمين وصناع السياسات والجمهور، بهدف تعزيز الفهم والمساءلة ومنع الفظائع المستقبلية.',
            ],

            // Historical Context
            [
                'key' => 'historical_context_title',
                'group' => 'about_page',
                'en' => 'Historical Context',
                'ar' => 'السياق التاريخي',
            ],
            [
                'key' => 'historical_context_description',
                'group' => 'about_page',
                'en' => 'The crisis unfolded against a backdrop of long-standing tensions and discrimination against the religious minority group. Decades of marginalization and persecution culminated in a systematic campaign of violence and oppression, beginning in 2014. The archive meticulously documents the events leading up to the crisis, the atrocities committed, and the ongoing impact on the affected communities.',
                'ar' => 'تطورت الأزمة على خلفية من التوترات طويلة الأمد والتمييز ضد الأقلية الدينية. عقود من التهميش والاضطهاد بلغت ذروتها في حملة منهجية من العنف والقمع، بدءاً من عام 2014. يوثق الأرشيف بدقة الأحداث التي أدت إلى الأزمة، والفظائع المرتكبة، والتأثير المستمر على المجتمعات المتضررة.',
            ],

            // Affected Community
            [
                'key' => 'affected_community_title',
                'group' => 'about_page',
                'en' => 'The Affected Community',
                'ar' => 'المجتمع المتضرر',
            ],
            [
                'key' => 'affected_community_description',
                'group' => 'about_page',
                'en' => 'The religious minority group, with a history spanning thousands of years in the region, has faced numerous challenges to their existence. This archive focuses on the recent atrocities, highlighting the resilience and strength of the community in the face of unimaginable suffering. It aims to amplify their voices and ensure their stories are heard.',
                'ar' => 'الأقلية الدينية، التي لها تاريخ يمتد لآلاف السنين في المنطقة، واجهت تحديات عديدة لوجودها. يركز هذا الأرشيف على الفظائع الأخيرة، مسلطاً الضوء على مرونة وقوة المجتمع في مواجهة المعاناة التي لا يمكن تصورها. يهدف إلى تضخيم أصواتهم وضمان سماع قصصهم.',
            ],

            // Archive Purpose
            [
                'key' => 'archive_purpose_title',
                'group' => 'about_page',
                'en' => 'Purpose of the Archive',
                'ar' => 'الغرض من الأرشيف',
            ],
            [
                'key' => 'archive_purpose_description',
                'group' => 'about_page',
                'en' => 'The Crisis Archive serves multiple critical purposes:',
                'ar' => 'يخدم أرشيف الأزمة عدة أغراض حيوية:',
            ],

            // Archive Purpose Items
            [
                'key' => 'purpose_item_1_title',
                'group' => 'about_page',
                'en' => 'Documentation:',
                'ar' => 'التوثيق:',
            ],
            [
                'key' => 'purpose_item_1_description',
                'group' => 'about_page',
                'en' => 'To create a comprehensive and accessible record of the atrocities, including testimonies, documents, images, and other forms of evidence.',
                'ar' => 'لإنشاء سجل شامل ومتاح للفظائع، بما في ذلك الشهادات والوثائق والصور وأشكال أخرى من الأدلة.',
            ],
            [
                'key' => 'purpose_item_2_title',
                'group' => 'about_page',
                'en' => 'Education:',
                'ar' => 'التعليم:',
            ],
            [
                'key' => 'purpose_item_2_description',
                'group' => 'about_page',
                'en' => 'To educate the public about the crisis, its causes, and its consequences, fostering a deeper understanding of the issues.',
                'ar' => 'لتثقيف الجمهور حول الأزمة وأسبابها وعواقبها، وتعزيز فهم أعمق للقضايا.',
            ],
            [
                'key' => 'purpose_item_3_title',
                'group' => 'about_page',
                'en' => 'Advocacy:',
                'ar' => 'المناصرة:',
            ],
            [
                'key' => 'purpose_item_3_description',
                'group' => 'about_page',
                'en' => 'To support advocacy efforts for justice, accountability, and the prevention of future atrocities.',
                'ar' => 'لدعم جهود المناصرة من أجل العدالة والمساءلة ومنع الفظائع المستقبلية.',
            ],
            [
                'key' => 'purpose_item_4_title',
                'group' => 'about_page',
                'en' => 'Remembrance:',
                'ar' => 'التذكر:',
            ],
            [
                'key' => 'purpose_item_4_description',
                'group' => 'about_page',
                'en' => 'To honor the victims and survivors, ensuring their stories are not forgotten and contributing to the healing process.',
                'ar' => 'لتكريم الضحايا والناجين، وضمان عدم نسيان قصصهم والمساهمة في عملية الشفاء.',
            ],
            [
                'key' => 'purpose_item_5_title',
                'group' => 'about_page',
                'en' => 'Research:',
                'ar' => 'البحث:',
            ],
            [
                'key' => 'purpose_item_5_description',
                'group' => 'about_page',
                'en' => 'To provide a valuable resource for researchers studying genocide, human rights, and related fields.',
                'ar' => 'لتوفير مصدر قيم للباحثين الذين يدرسون الإبادة الجماعية وحقوق الإنسان والمجالات ذات الصلة.',
            ],

            // Key Facts
            [
                'key' => 'key_facts_title',
                'group' => 'about_page',
                'en' => 'Key Facts and Statistics',
                'ar' => 'الحقائق والإحصائيات الرئيسية',
            ],

            // Key Facts Items
            [
                'key' => 'fact_start_date_label',
                'group' => 'about_page',
                'en' => 'Start Date',
                'ar' => 'تاريخ البداية',
            ],
            [
                'key' => 'fact_start_date_value',
                'group' => 'about_page',
                'en' => 'August 2014',
                'ar' => 'أغسطس 2014',
            ],
            [
                'key' => 'fact_peak_violence_label',
                'group' => 'about_page',
                'en' => 'Peak Violence',
                'ar' => 'ذروة العنف',
            ],
            [
                'key' => 'fact_peak_violence_value',
                'group' => 'about_page',
                'en' => '2014-2017',
                'ar' => '2014-2017',
            ],
            [
                'key' => 'fact_casualties_label',
                'group' => 'about_page',
                'en' => 'Estimated Casualties',
                'ar' => 'الضحايا المقدرون',
            ],
            [
                'key' => 'fact_casualties_value',
                'group' => 'about_page',
                'en' => 'Thousands',
                'ar' => 'الآلاف',
            ],
            [
                'key' => 'fact_displaced_label',
                'group' => 'about_page',
                'en' => 'Displaced Persons',
                'ar' => 'النازحون',
            ],
            [
                'key' => 'fact_displaced_value',
                'group' => 'about_page',
                'en' => 'Hundreds of thousands',
                'ar' => 'مئات الآلاف',
            ],
            [
                'key' => 'fact_recognition_label',
                'group' => 'about_page',
                'en' => 'International Recognition',
                'ar' => 'الاعتراف الدولي',
            ],
            [
                'key' => 'fact_recognition_value',
                'group' => 'about_page',
                'en' => 'Recognized as genocide by several nations and organizations',
                'ar' => 'معترف بها كإبادة جماعية من قبل عدة دول ومنظمات',
            ],

            // Mission Statement
            [
                'key' => 'mission_statement_title',
                'group' => 'about_page',
                'en' => 'Mission Statement',
                'ar' => 'بيان المهمة',
            ],
            [
                'key' => 'mission_statement_description',
                'group' => 'about_page',
                'en' => 'Our mission is to preserve the memory of the atrocities committed against the religious minority group, to educate current and future generations about the dangers of hatred and violence, and to advocate for a world free from genocide and mass atrocities. We are committed to ensuring that the voices of the victims and survivors are heard and that their experiences contribute to a more just and peaceful future.',
                'ar' => 'مهمتنا هي الحفاظ على ذكرى الفظائع المرتكبة ضد الأقلية الدينية، وتثقيف الأجيال الحالية والمستقبلية حول مخاطر الكراهية والعنف، والدعوة لعالم خالٍ من الإبادة الجماعية والفظائع الجماعية. نحن ملتزمون بضمان سماع أصوات الضحايا والناجين وأن تساهم تجاربهم في مستقبل أكثر عدالة وسلاماً.',
            ],
        ];

        foreach ($localizations as $item) {
            foreach (['en', 'ar'] as $language) {
                Localization::updateOrCreate(
                    [
                        'key' => $item['key'],
                        'language' => $language,
                        'group' => $item['group'],
                    ],
                    [
                        'value' => $item[$language],
                        'is_active' => true,
                        'description' => "About page content for {$item['key']}",
                    ]
                );
            }
        }
    }
}

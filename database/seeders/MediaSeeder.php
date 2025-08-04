<?php
// database/seeders/MediaSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Media;
use App\Models\Localization;
use Illuminate\Support\Str;

class MediaSeeder extends Seeder
{
    public function run()
    {
        $mediaTypes = ['image', 'video'];
        $sourceTypes = ['upload', 'google_drive', 'external_link'];
        
        $sampleImages = [
            'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=600&fit=crop',
        ];
        
        $sampleVideos = [
            'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        ];

        for ($i = 1; $i <= 20; $i++) {
            $type = $mediaTypes[array_rand($mediaTypes)];
            $sourceType = $sourceTypes[array_rand($sourceTypes)];
            $mediaId = 'media-' . date('Y') . '-' . str_pad($i, 3, '0', STR_PAD_LEFT);
            
            // Create localization keys
            $titleKey = 'media_title_' . time() . '_' . Str::random(6) . '_' . $i;
            $descriptionKey = 'media_desc_' . time() . '_' . Str::random(6) . '_' . $i;
            
            // Create localizations
            foreach (['en', 'ar'] as $lang) {
                Localization::create([
                    'key' => $titleKey,
                    'language' => $lang,
                    'value' => $lang === 'en' ? "Sample {$type} {$i}" : "عينة {$type} {$i}",
                    'group' => 'media',
                    'is_active' => true,
                ]);
                
                Localization::create([
                    'key' => $descriptionKey,
                    'language' => $lang,
                    'value' => $lang === 'en' ? "Description for {$type} {$i}" : "وصف لـ {$type} {$i}",
                    'group' => 'media',
                    'is_active' => true,
                ]);
            }
            
            $mediaData = [
                'media_id' => $mediaId,
                'type' => $type,
                'source_type' => $sourceType,
                'title_key' => $titleKey,
                'description_key' => $descriptionKey,
                'is_active' => true,
                'sort_order' => $i,
                'featured_on_home' => $i <= 10, // First 10 featured
            ];
            
            // Set URLs based on source type
            switch ($sourceType) {
                case 'upload':
                    $mediaData['file_path'] = $type === 'image' ? 'uploads/images/sample_' . $i . '.jpg' : 'uploads/videos/sample_' . $i . '.mp4';
                    break;
                case 'google_drive':
                    $mediaData['google_drive_id'] = '1' . str_pad($i, 32, '0', STR_PAD_LEFT);
                    break;
                case 'external_link':
                    $mediaData['external_url'] = $type === 'image' ? $sampleImages[array_rand($sampleImages)] : $sampleVideos[array_rand($sampleVideos)];
                    break;
            }
            
            Media::create($mediaData);
        }
    }
}

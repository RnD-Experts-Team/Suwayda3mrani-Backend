<?php
// app/Models/Story.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Storage;

class Story extends Model
{
    protected $fillable = [
        'story_id',
        'title_key',
        'description_key',
        'background_image_path',
        'url_slug',
        'external_url',
        'is_active',
        'is_featured',
        'sort_order',
        'metadata'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'metadata' => 'array'
    ];

    // Relationships
    public function media()
    {
        return $this->morphToMany(Media::class, 'mediable', 'media_relations')
                    ->withPivot('sort_order')
                    ->orderBy('sort_order');
    }

    public function getMediaItems()
    {
        return $this->media()->get();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('created_at', 'desc');
    }

    // Helper Methods
    public function getMultilingualContent()
    {
        $titleTranslations = $this->getTranslationsForKey($this->title_key);
        $descriptionTranslations = $this->getTranslationsForKey($this->description_key);
        
        // Get background image URL
        $backgroundImage = $this->background_image_path 
            ? Storage::disk('public')->url($this->background_image_path)
            : null;

        return [
            'id' => $this->id,
            'story_id' => $this->story_id,
            'url_slug' => $this->url_slug,
            'external_url' => $this->external_url,
            'backgroundImage' => $backgroundImage,
            'title' => [
                'en' => $titleTranslations['en'] ?? '',
                'ar' => $titleTranslations['ar'] ?? ''
            ],
            'description' => [
                'en' => $descriptionTranslations['en'] ?? '',
                'ar' => $descriptionTranslations['ar'] ?? ''
            ],
            'metadata' => $this->metadata,
            'url' => $this->external_url ?: "#story-{$this->id}"
        ];
    }

    private function getTranslationsForKey($key)
    {
        if (!$key) return ['en' => '', 'ar' => ''];

        $translations = Localization::where('key', $key)
            ->whereIn('language', ['en', 'ar'])
            ->pluck('value', 'language')
            ->toArray();

        return [
            'en' => $translations['en'] ?? '',
            'ar' => $translations['ar'] ?? ''
        ];
    }

    public function attachMedia($mediaIds)
    {
        if (empty($mediaIds)) return;

        foreach ($mediaIds as $index => $mediaId) {
            $this->media()->create([
                'media_id' => $mediaId,
                'sort_order' => $index
            ]);
        }
    }
}

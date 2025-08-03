<?php
// app/Models/Cases.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\Storage;

class Cases extends Model
{
    protected $table = 'cases'; 

    protected $fillable = [
        'case_id',
        'type', 
        'title_key',
        'url_slug',
        'external_url',
        'incident_date',
        'location',
        'description_key',
        'metadata',
        'is_active',
        'is_featured',
        'sort_order'
    ];

    protected $casts = [
        'metadata' => 'array',
        'incident_date' => 'date',
        'is_active' => 'boolean',
        'is_featured' => 'boolean'
    ];

    // Relationships
    public function details(): HasMany
    {
        return $this->hasMany(CaseDetail::class, 'case_id')->orderBy('sort_order');
    }

    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    public function getMediaItems()
    {
        return $this->media()->with('media')->get()->pluck('media');
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

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('incident_date', 'desc');
    }

    // Helper Methods
    public function getMultilingualContent()
    {
        $titleTranslations = $this->getTranslationsForKey($this->title_key);
        $descriptionTranslations = $this->description_key ? $this->getTranslationsForKey($this->description_key) : null;
        
        // Get case details with translations
        $details = $this->details->map(function ($detail) {
            return [
                'key' => $detail->getKeyTranslations(),
                'value' => $detail->getValueTranslations(),
                'sort_order' => $detail->sort_order
            ];
        });

        // Get primary image (first uploaded image)
        $primaryMedia = $this->getMediaItems()->where('type', 'image')->first();
        $imagePath = $primaryMedia ? $primaryMedia->getMultilingualContent()['url'] : null;

        return [
            'id' => $this->id,
            'case_id' => $this->case_id,
            'type' => $this->type,
            'url' => $this->external_url,
            'url_slug' => $this->url_slug,
            'incident_date' => $this->incident_date?->format('Y-m-d'),
            'location' => $this->location,
            'imagePath' => $imagePath,
            'title' => [
                'en' => $titleTranslations['en'] ?? '',
                'ar' => $titleTranslations['ar'] ?? ''
            ],
            'description' => $descriptionTranslations ? [
                'en' => $descriptionTranslations['en'] ?? '',
                'ar' => $descriptionTranslations['ar'] ?? ''
            ] : null,
            'details' => $details->toArray(),
            'metadata' => $this->metadata
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

    // Static method to get case types
    public static function getCaseTypes()
    {
        return [
            'deaths' => ['en' => 'Deaths', 'ar' => 'وفيات'],
            'houses' => ['en' => 'Houses', 'ar' => 'منازل'],
            'migrations' => ['en' => 'Migrations', 'ar' => 'هجرات'],
            'thefts' => ['en' => 'Thefts', 'ar' => 'سرقات']
        ];
    }
}

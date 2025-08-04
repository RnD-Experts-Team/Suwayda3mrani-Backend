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

    public function media()
{
    return $this->morphToMany(Media::class, 'mediable', 'media_relations') // ✅ Specify correct table
                ->withPivot('sort_order')
                ->orderBy('sort_order');
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
    $descriptionTranslations = $this->getTranslationsForKey($this->description_key);
    
    // ✅ FIXED: Get media from THIS case, not from Media model
    $caseMedia = $this->media; // This gets media attached to this case
    $imagePath = null;
    
    if ($caseMedia && $caseMedia->count() > 0) {
        $firstMedia = $caseMedia->first();
        $mediaContent = $firstMedia->getMultilingualContent();
        $imagePath = $mediaContent['url'] ?? null;
    }

    // Get case details with translations
    $details = [];
    if ($this->details) {
        foreach ($this->details as $detail) {
            $keyTranslations = $this->getTranslationsForKey($detail->key_localization_key);
            $valueTranslations = $this->getTranslationsForKey($detail->value_localization_key);
            
            $details[] = [
                'key' => [
                    'en' => $keyTranslations['en'] ?? '',
                    'ar' => $keyTranslations['ar'] ?? ''
                ],
                'value' => [
                    'en' => $valueTranslations['en'] ?? '',
                    'ar' => $valueTranslations['ar'] ?? ''
                ],
                'sort_order' => $detail->sort_order
            ];
        }
    }

    return [
        'id' => $this->id,
        'case_id' => $this->case_id,
        'type' => $this->type,
        'url_slug' => $this->url_slug,
        'external_url' => $this->external_url,
        'incident_date' => $this->incident_date?->format('Y-m-d'),
        'location' => $this->location,
        'imagePath' => $imagePath,
        'title' => [
            'en' => $titleTranslations['en'] ?? '',
            'ar' => $titleTranslations['ar'] ?? ''
        ],
        'description' => [
            'en' => $descriptionTranslations['en'] ?? '',
            'ar' => $descriptionTranslations['ar'] ?? ''
        ],
        'details' => $details,
        'url' => $this->external_url ?: "/cases/{$this->url_slug}"
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

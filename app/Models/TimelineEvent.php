<?php
// app/Models/TimelineEvent.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class TimelineEvent extends Model
{
    protected $fillable = [
        'timeline_event_id',
        'title_key',
        'period',
        'description_key',
        'is_highlighted',
        'is_active',
        'sort_order'
    ];

    protected $casts = [
        'is_highlighted' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer'
    ];

    // ===================================
    // RELATIONSHIPS
    // ===================================

    public function media()
    {
        return $this->morphToMany(Media::class, 'mediable', 'media_relations')
                    ->withPivot('sort_order')
                    ->orderBy('sort_order');
    }

    // ===================================
    // SCOPES
    // ===================================

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeHighlighted(Builder $query): Builder
    {
        return $query->where('is_highlighted', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('created_at');
    }

    // ===================================
    // HELPER METHODS
    // ===================================

    public function getMultilingualContent(): array
    {
        $titleTranslations = $this->getTranslationsForKey($this->title_key);
        $descriptionTranslations = $this->getTranslationsForKey($this->description_key);

        // Get media info
        $mediaInfo = null;
        $firstMedia = $this->media->first();
        if ($firstMedia) {
            $mediaContent = $firstMedia->getMultilingualContent();
            $mediaInfo = [
                'type' => $firstMedia->type,
                'url' => $mediaContent['url'],
                'thumbnail' => $mediaContent['thumbnail'] ?? $mediaContent['url']
            ];
        }

        return [
            'id' => $this->id,
            'timeline_event_id' => $this->timeline_event_id,
            'period' => $this->period,
            'title' => [
                'en' => $titleTranslations['en'] ?? '',
                'ar' => $titleTranslations['ar'] ?? ''
            ],
            'description' => [
                'en' => $descriptionTranslations['en'] ?? '',
                'ar' => $descriptionTranslations['ar'] ?? ''
            ],
            'isHighlighted' => $this->is_highlighted,
            'mediaType' => $mediaInfo['type'] ?? null,
            'mediaUrl' => $mediaInfo['url'] ?? null,
            'thumbnailUrl' => $mediaInfo['thumbnail'] ?? null,
            'sort_order' => $this->sort_order
        ];
    }

    private function getTranslationsForKey(?string $key): array
    {
        if (!$key) {
            return ['en' => '', 'ar' => ''];
        }

        $translations = \App\Models\Localization::where('key', $key)
            ->whereIn('language', ['en', 'ar'])
            ->where('is_active', true)
            ->pluck('value', 'language')
            ->toArray();

        return [
            'en' => $translations['en'] ?? '',
            'ar' => $translations['ar'] ?? ''
        ];
    }

    // ===================================
    // STATIC METHODS
    // ===================================

    public static function generateTimelineEventId(): string
    {
        $lastEvent = self::orderByDesc('created_at')->first();
        $lastNumber = $lastEvent ? (int)substr($lastEvent->timeline_event_id, -3) : 0;
        $newNumber = str_pad($lastNumber + 1, 3, '0', STR_PAD_LEFT);
        
        return "timeline-event-{$newNumber}";
    }
}

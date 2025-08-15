<?php
// app/Models/Media.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Media extends Model
{
    protected $fillable = [
        'media_id',
        'type',
        'source_type',
        'file_path',
        'google_drive_id',
        'external_url',
        'thumbnail_path',
        'title_key',
        'description_key',
        'source_url',
        'is_active',
        'sort_order',
        'featured_on_home'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'featured_on_home' => 'boolean',
        'sort_order' => 'integer'
    ];

    // ✅ Fixed Relationships
    public function testimonies()
    {
        return $this->morphedByMany(Testimony::class, 'mediable', 'media_relations');
    }

    public function cases()
    {
        return $this->morphedByMany(Cases::class, 'mediable', 'media_relations');
    }

    public function stories()
{
    return $this->morphedByMany(Story::class, 'mediable', 'media_relations');
}
public function aidOrganizations()
{
    return $this->morphedByMany(AidOrganization::class, 'mediable', 'media_relations') // ✅ Specify correct table
                ->withPivot('sort_order')
                ->orderBy('sort_order');
}
    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeBySourceType(Builder $query, string $sourceType): Builder
    {
        return $query->where('source_type', $sourceType);
    }

    public function scopeImages(Builder $query): Builder
    {
        return $query->where('type', 'image');
    }

    public function scopeVideos(Builder $query): Builder
    {
        return $query->where('type', 'video');
    }

    public function scopeFeaturedOnHome(Builder $query): Builder
    {
        return $query->where('featured_on_home', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('created_at', 'desc');
    }

    public function scopeRandomForHome(Builder $query, int $limit = 10): Builder
    {
        return $query->active()
            ->where('featured_on_home', true)
            ->inRandomOrder()
            ->limit($limit);
    }

    // Helper methods for different source types
    public function getMediaUrl(): ?string
    {
        switch ($this->source_type) {
            case 'upload':
                return $this->file_path ? \Storage::disk('public')->url($this->file_path) : null;
            case 'google_drive':
                if (!$this->google_drive_id) {
                    return null;
                }

                // If it's a Google Drive IMAGE → use the lh3 direct content host
                if (strtolower((string) $this->type) === 'image') {
                    return "https://lh3.googleusercontent.com/d/{$this->google_drive_id}";
                }

                // Otherwise (e.g., video) keep existing behavior
                return "https://drive.google.com/uc?id={$this->google_drive_id}";
            case 'external_link':
                return $this->external_url;
            default:
                return null;
        }
    }

    public function getDirectUrl(): ?string
    {
        switch ($this->source_type) {
            case 'upload':
                return $this->file_path ? \Storage::disk('public')->url($this->file_path) : null;
            case 'google_drive':
               if (!$this->google_drive_id) {
                    return null;
                }

                // If it's a Google Drive IMAGE → use the lh3 direct content host
                if (strtolower((string) $this->type) === 'image') {
                    return "https://lh3.googleusercontent.com/d/{$this->google_drive_id}";
                }

                // Otherwise (e.g., video) keep existing behavior
                return "https://drive.google.com/uc?id={$this->google_drive_id}";
            case 'external_link':
                return $this->external_url;
            default:
                return null;
        }
    }

    public function getThumbnailUrl(): ?string
    {
        if ($this->thumbnail_path) {
            return \Storage::disk('public')->url($this->thumbnail_path);
        }

        // Auto-generate thumbnail for Google Drive images
        if ($this->source_type === 'google_drive' && $this->type === 'image') {
            return "https://lh3.googleusercontent.com/d/{$this->google_drive_id}";
        }

        return null;
    }

    public function getMultilingualContent(): array
    {
        $content = [
            'id' => $this->media_id,
            'type' => $this->type,
            'source_type' => $this->source_type,
            'url' => $this->getDirectUrl(),
            'sourceUrl' => $this->source_url,
        ];

        // Get translations for both languages
        foreach (['en', 'ar'] as $language) {
            if ($this->title_key) {
                $content['title'][$language] = $this->getTranslation($this->title_key, $language);
            }

            if ($this->description_key) {
                $content['description'][$language] = $this->getTranslation($this->description_key, $language);
            }
        }

        if ($thumbnail = $this->getThumbnailUrl()) {
            $content['thumbnail'] = $thumbnail;
        }

        return $content;
    }

    public function getTranslation(string $key, string $language): string
    {
        return \App\Models\Localization::where('key', $key)
            ->where('language', $language)
            ->where('is_active', true)
            ->value('value') ?? '';
    }

    // Static methods for home screen
    public static function getRandomForHome(int $limit = 10): array
    {
        $mediaItems = self::randomForHome($limit)->get();
        
        return $mediaItems->map(function ($media) {
            return $media->getMultilingualContent();
        })->toArray();
    }

    /**
 * Get media content specifically formatted for the gallery frontend
 * This is separate from getMultilingualContent() to avoid breaking existing functionality
 */
public function getGalleryContent(): array
{
    // Get translations
    $titleTranslations = $this->getTranslationsForKey($this->title_key);
    $descriptionTranslations = $this->getTranslationsForKey($this->description_key);

    return [
        'id' => $this->id,
        'media_id' => $this->media_id,
        'src' => $this->getDirectUrl(),
        'thumbnail' => $this->getThumbnailUrl() ?: $this->getDirectUrl(),
        'alt' => $titleTranslations['en'] ?: "Media item {$this->id}",
        'title' => [
            'en' => $titleTranslations['en'] ?? '',
            'ar' => $titleTranslations['ar'] ?? ''
        ],
        'description' => [
            'en' => $descriptionTranslations['en'] ?? '',
            'ar' => $descriptionTranslations['ar'] ?? ''
        ],
        'type' => $this->type,
        'source_url' => $this->source_url,
        'created_at' => $this->created_at?->toISOString()
    ];
}

/**
 * Helper method to get translations for both languages at once
 * Only used by getGalleryContent()
 */
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
}

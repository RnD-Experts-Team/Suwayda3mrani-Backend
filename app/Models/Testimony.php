<?php
// app/Models/Testimony.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Testimony extends Model
{
    protected $fillable = [
        'testimony_id',
        'category_key',
        'title_key',
        'description_key',
        'survivor_name',
        'survivor_age',
        'survivor_location',
        'date_of_incident',
        'background_image_path',
        'url_slug',
        'is_active',
        'is_featured',
        'sort_order'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
        'date_of_incident' => 'date',
        'survivor_age' => 'integer'
    ];

    // Relationships
    public function media()
    {
        return $this->morphToMany(Media::class, 'mediable', 'media_relations')
                    ->withPivot('sort_order')
                    ->orderBy('media_relations.sort_order');
    }
public function getMediaItems()
{
    return $this->media()->get();
}
    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('created_at', 'desc');
    }

    public function scopeRecent(Builder $query, int $limit = 5): Builder
    {
        return $query->active()->orderBy('created_at', 'desc')->limit($limit);
    }

    // Helper methods
    public function getBackgroundImageUrl(): ?string
    {
        return $this->background_image_path ? \Storage::disk('public')->url($this->background_image_path) : null;
    }

    public function getUrl(): string
    {
        return "/testimonies/{$this->url_slug}";
    }

    public function getTranslatedContent(string $language): array
    {
        $content = [
            'id' => $this->testimony_id,
            'url' => $this->getUrl(),
            'survivor_name' => $this->survivor_name,
            'survivor_age' => $this->survivor_age,
            'survivor_location' => $this->survivor_location,
            'date_of_incident' => $this->date_of_incident?->format('Y-m-d'),
        ];

        if ($this->category_key) {
            $content['category'] = $this->getTranslation($this->category_key, $language);
        }

        if ($this->title_key) {
            $content['title'] = $this->getTranslation($this->title_key, $language);
        }

        if ($this->description_key) {
            $content['description'] = $this->getTranslation($this->description_key, $language);
        }

        if ($this->background_image_path) {
            $content['imageUrl'] = $this->getBackgroundImageUrl();
        }

        return $content;
    }

    public function getMultilingualContent(): array
    {
        $content = [
            'id' => $this->testimony_id,
            'url' => $this->getUrl(),
            'survivor_name' => $this->survivor_name,
            'survivor_age' => $this->survivor_age,
            'survivor_location' => $this->survivor_location,
            'date_of_incident' => $this->date_of_incident?->format('Y-m-d'),
        ];

        // Get translations for both languages
        foreach (['en', 'ar'] as $language) {
            if ($this->category_key) {
                $content['category'][$language] = $this->getTranslation($this->category_key, $language);
            }

            if ($this->title_key) {
                $content['title'][$language] = $this->getTranslation($this->title_key, $language);
            }

            if ($this->description_key) {
                $content['description'][$language] = $this->getTranslation($this->description_key, $language);
            }
        }

        if ($this->background_image_path) {
            $content['imageUrl'] = $this->getBackgroundImageUrl();
        }

        return $content;
    }

    public function getWithMedia(): array
    {
        $content = $this->getMultilingualContent();
        
        // Add media gallery
        $content['media'] = $this->media()->active()->get()->map(function ($media) {
            return $media->getMultilingualContent();
        })->toArray();

        return $content;
    }

    private function getTranslation(string $key, string $language): string
    {
        return \App\Models\Localization::where('key', $key)
            ->where('language', $language)
            ->where('is_active', true)
            ->value('value') ?? '';
    }

    // Static methods for home screen
    public static function getRecentForHome(int $limit = 3): array
    {
        $testimonies = self::active()->featured()->recent($limit)->get();
        
        return $testimonies->map(function ($testimony) {
            return [
                'id' => $testimony->testimony_id,
                'type' => 'testimonial',
                'content' => $testimony->getMultilingualContent()
            ];
        })->toArray();
    }

    // Method to attach media when creating testimony
    public function attachMedia(array $mediaIds): void
    {
        foreach ($mediaIds as $index => $mediaId) {
            $this->media()->attach($mediaId, ['sort_order' => $index + 1]);
        }
    }
}

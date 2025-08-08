<?php
// app/Models/HomeSection.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
class HomeSection extends Model
{
    protected $fillable = [
        'section_id',
        'type',
        'title_key',
        'description_key',
        'button_text_key',
        'button_variant',
        'action_key',
        'image_path',
        'is_active',
        'sort_order'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer'
    ];

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }

    // Helper methods
    public function getImageUrl(): ?string
    {
        return $this->image_path ? Storage::disk('public')->url($this->image_path) : null;
    }

    public function getTranslatedContent(string $language): array
    {
        $content = [];
        
        if ($this->title_key) {
            $content['title'] = $this->getTranslation($this->title_key, $language);
        }
        
        if ($this->description_key) {
            $content['description'] = $this->getTranslation($this->description_key, $language);
        }
        
        if ($this->button_text_key) {
            $content['buttonText'] = $this->getTranslation($this->button_text_key, $language);
        }
        
        if ($this->button_variant) {
            $content['buttonVariant'] = $this->button_variant;
        }

        if ($this->image_path) {
            $content['image'] = $this->getImageUrl();
        }

        return $content;
    }

    private function getTranslation(string $key, string $language): string
    {
        return \App\Models\Localization::where('key', $key)
            ->where('language', $language)
            ->where('is_active', true)
            ->value('value') ?? '';
    }
}

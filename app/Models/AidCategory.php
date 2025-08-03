<?php
// app/Models/AidCategory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class AidCategory extends Model
{
    protected $fillable = [
        'name_key',
        'slug',
        'icon',
        'color',
        'is_active',
        'sort_order'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer'
    ];

    // Relationships
    public function organizations()
    {
        return $this->belongsToMany(AidOrganization::class, 'aid_organization_categories');
    }

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('name_key');
    }

    // Helper methods
    public function getTranslatedName(string $language): string
    {
        return \App\Models\Localization::where('key', $this->name_key)
            ->where('language', $language)
            ->where('is_active', true)
            ->value('value') ?? '';
    }

    public function getMultilingualContent(): array
    {
        $content = [
            'slug' => $this->slug,
            'icon' => $this->icon,
            'color' => $this->color,
        ];

        foreach (['en', 'ar'] as $language) {
            $content['name'][$language] = $this->getTranslatedName($language);
        }

        return $content;
    }

    public static function getAllActive(): array
    {
        return self::active()->ordered()->get()->map(function ($category) {
            return $category->getMultilingualContent();
        })->toArray();
    }
}

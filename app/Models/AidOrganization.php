<?php
// app/Models/AidOrganization.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class AidOrganization extends Model
{
    protected $fillable = [
        'organization_id',
        'name_key',
        'description_key',
        'background_image_path',
        'website_url',
        'contact_url',
        'type', // 'organizations' or 'initiatives'
        'is_active',
        'is_featured',
        'sort_order'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'sort_order' => 'integer'
    ];

    // Relationships
    public function categories()
    {
        return $this->belongsToMany(AidCategory::class, 'aid_organization_categories');
    }

    public function media()
    {
        return $this->morphToMany(Media::class, 'mediable', 'media_relations')
                    ->withPivot('sort_order')
                    ->orderBy('media_relations.sort_order');
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

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeOrganizations(Builder $query): Builder
    {
        return $query->where('type', 'organizations');
    }

    public function scopeInitiatives(Builder $query): Builder
    {
        return $query->where('type', 'initiatives');
    }

    public function scopeByCategory(Builder $query, string $categorySlug): Builder
    {
        return $query->whereHas('categories', function ($q) use ($categorySlug) {
            $q->where('slug', $categorySlug);
        });
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('created_at', 'desc');
    }

    // Helper methods
    public function getBackgroundImageUrl(): ?string
    {
        return $this->background_image_path ? \Storage::disk('public')->url($this->background_image_path) : null;
    }

    public function getUrl(): string
    {
        return "/aid-organizations/{$this->organization_id}";
    }

    public function getTranslatedContent(string $language): array
    {
        $content = [
            'id' => $this->organization_id,
            'type' => $this->type,
            'url' => $this->getUrl(),
            'website_url' => $this->website_url,
            'contact_url' => $this->contact_url,
        ];

        if ($this->name_key) {
            $content['name'] = $this->getTranslation($this->name_key, $language);
        }

        if ($this->description_key) {
            $content['description'] = $this->getTranslation($this->description_key, $language);
        }

        if ($this->background_image_path) {
            $content['backgroundImage'] = $this->getBackgroundImageUrl();
        }

        return $content;
    }

    public function getMultilingualContent(): array
    {
        $content = [
            'id' => $this->organization_id,
            'type' => $this->type,
            'url' => $this->getUrl(),
            'website_url' => $this->website_url,
            'contact_url' => $this->contact_url,
            'categories' => $this->categories->pluck('slug')->toArray(),
        ];

        // Get translations for both languages
        foreach (['en', 'ar'] as $language) {
            if ($this->name_key) {
                $content[$language]['name'] = $this->getTranslation($this->name_key, $language);
            }

            if ($this->description_key) {
                $content[$language]['description'] = $this->getTranslation($this->description_key, $language);
            }

            if ($this->background_image_path) {
                $content[$language]['backgroundImage'] = $this->getBackgroundImageUrl();
            }

            $content[$language]['url'] = $this->getUrl();
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

    // Static methods for fetching organized data
    public static function getOrganizedByType(): array
    {
        $organizations = self::active()->with('categories')->ordered()->get();
        
        $result = [];
        
        foreach ($organizations as $org) {
            $type = $org->type;
            
            if (!isset($result[$type])) {
                $result[$type] = [];
            }
            
            $result[$type][] = $org->getMultilingualContent();
        }
        
        return $result;
    }

    public static function getForHome(int $limit = 4): array
    {
        $organizations = self::active()->featured()->ordered()->limit($limit)->get();
        
        return $organizations->map(function ($org) {
            return $org->getMultilingualContent();
        })->toArray();
    }

    // Method to attach categories when creating organization
    public function attachCategories(array $categoryIds): void
    {
        $this->categories()->sync($categoryIds);
    }

    public static function getPageStructure(): array
{
    // Get page content from localizations
    $pageContent = [
        'heroTitle' => self::getPageTranslations('aid_hero_title'),
        'heroDescription' => self::getPageTranslations('aid_hero_description'),
        'sectionTitle' => self::getPageTranslations('aid_section_title'),
    ];

    // Get action buttons
    $actionButtons = [
        [
            'text' => self::getPageTranslations('donate_button'),
            'url' => '/donate'
        ],
        [
            'text' => self::getPageTranslations('volunteer_button'),
            'url' => '/volunteer'
        ],
        [
            'text' => self::getPageTranslations('get_involved_button'),
            'url' => '/get-involved'
        ]
    ];

    // Get organizations grouped by type
    $organizations = self::active()->with('categories')->ordered()->get()->groupBy('type');
    
    $sections = [];
    
    foreach ($organizations as $type => $orgs) {
        $sectionKey = $type === 'organizations' ? 'international_organizations' : 'local_groups';
        
        $sections[] = [
            'id' => $sectionKey,
            'title' => self::getPageTranslations($sectionKey . '_title'),
            'type' => $type,
            'items' => $orgs->map(function ($org) {
                return $org->getMultilingualContent();
            })->toArray()
        ];
    }

    return [
        'pageContent' => $pageContent,
        'actionButtons' => $actionButtons,
        'sections' => $sections
    ];
}

private static function getPageTranslations(string $key): array
{
    $translations = [];
    foreach (['en', 'ar'] as $language) {
        $translations[$language] = \App\Models\Localization::where('key', $key)
            ->where('language', $language)
            ->where('is_active', true)
            ->value('value') ?? '';
    }
    return $translations;
}
}

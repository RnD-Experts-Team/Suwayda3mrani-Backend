<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Localization extends Model
{
    protected $fillable = [
        'language',
        'group',
        'key',
        'value',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByLanguage(Builder $query, string $language): Builder
    {
        return $query->where('language', $language);
    }

    public function scopeByGroup(Builder $query, ?string $group): Builder
    {
        if ($group === 'null') {
            return $query->whereNull('group');
        }
        return $query->where('group', $group);
    }

    // Helper methods
    public static function getTranslations(string $language): array
    {
        return self::active()
            ->byLanguage($language)
            ->get()
            ->groupBy('group')
            ->map(function ($items) {
                return $items->pluck('value', 'key')->toArray();
            })
            ->toArray();
    }

    public static function getTranslationsByGroup(string $language, ?string $group = null): array
    {
        $query = self::active()->byLanguage($language);
        
        if ($group !== null) {
            $query->byGroup($group);
        }

        return $query->pluck('value', 'key')->toArray();
    }
}

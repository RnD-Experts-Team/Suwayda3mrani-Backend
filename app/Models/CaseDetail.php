<?php
// app/Models/CaseDetail.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaseDetail extends Model
{
    protected $fillable = [
        'case_id',
        'key_localization_key',
        'value_localization_key',
        'sort_order'
    ];

    // Relationships
    public function case(): BelongsTo
    {
        return $this->belongsTo(Cases::class, 'case_id');
    }

    // Helper Methods
    public function getKeyTranslations()
    {
        return $this->getTranslationsForKey($this->key_localization_key);
    }

    public function getValueTranslations()
    {
        return $this->getTranslationsForKey($this->value_localization_key);
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
}

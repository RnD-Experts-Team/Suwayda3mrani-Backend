<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shelter extends Model
{
    protected $fillable = [
        'entry_id',
        'place',
        'contact',
        'images',
    ];

    protected $casts = [
        'images' => 'array',
    ];

    public function entry(): BelongsTo
    {
        return $this->belongsTo(Entry::class);
    }

    public function displacedFamilies(): HasMany
    {
        return $this->hasMany(DisplacedFamily::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entry extends Model
{
    protected $fillable = [
        'form_id',
        'entry_number',
        'date_submitted',
        'submitter_name',
        'location',
        'status',
        'InternalLink',
        'notes'
    ];

    protected $casts = [
        'date_submitted' => 'datetime',
    ];

    public function host(): HasOne
    {
        return $this->hasOne(Host::class);
    }

    public function displacedFamilies(): HasMany
    {
        return $this->hasMany(DisplacedFamily::class);
    }

    public function martyrs(): HasMany
    {
        return $this->hasMany(Martyr::class);
    }

    public function shelters(): HasMany
    {
        return $this->hasMany(Shelter::class);
    }
}

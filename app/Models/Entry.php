<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Entry extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_id',
        'entry_number',
        'date_submitted',
        'submitter_name',
        'location',
        'status',
        'entry_metadata',
    ];

    // No casts for string/text fields

    public function displacedFamilies(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(DisplacedFamily::class, 'entry_id');
    }

    // Keep your existing relationships
    public function host()
    {
        return $this->belongsTo(Host::class);
    }

    public function martyrs()
    {
        return $this->hasMany(Martyr::class);
    }

    public function shelters()
    {
        return $this->hasMany(Shelter::class);
    }
}

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

    public function host()
    {
        return $this->hasOne(Host::class);
    }

    public function hostedFamilies()
    {
        return $this->hasMany(HostedFamily::class);
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

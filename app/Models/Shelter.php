<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shelter extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_id',
        'place',
        'contact',
        'images',
    ];

    // No casts

    public function entry()
    {
        return $this->belongsTo(Entry::class);
    }

    public function displacedFamilies()
    {
        return $this->hasMany(DisplacedFamily::class);
    }
}

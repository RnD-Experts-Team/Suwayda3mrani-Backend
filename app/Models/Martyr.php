<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Martyr extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_id',
        'name',
        'age',
        'place',
        'relative_contact',
        'image',
    ];

    // No casts

    public function entry()
    {
        return $this->belongsTo(Entry::class);
    }
}

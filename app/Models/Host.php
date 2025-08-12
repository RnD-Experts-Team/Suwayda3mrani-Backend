<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Host extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_id',
        'full_name',
        'family_count',
        'location',
        'address',
        'phone',
        'family_book_number',
    ];

    // No casts

    public function entry()
    {
        return $this->belongsTo(Entry::class);
    }
}

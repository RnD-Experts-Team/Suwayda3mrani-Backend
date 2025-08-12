<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HostedFamily extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_id',
        'individuals_count',
        'contact',
        'wife_name',
        'children_info',
        'needs',
        'assistance_type',
        'provider',
        'date_received',
        'notes',
        'return_possible',
        'previous_assistance',
        'images',
        'family_book_number',
    ];

    // No casts

    public function entry()
    {
        return $this->belongsTo(Entry::class);
    }
}

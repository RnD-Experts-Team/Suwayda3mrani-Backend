<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DisplacedFamily extends Model
{
    use HasFactory;

    protected $fillable = [
        'shelter_id',
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

    public function shelter()
    {
        return $this->belongsTo(Shelter::class);
    }
}

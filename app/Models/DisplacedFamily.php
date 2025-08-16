<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DisplacedFamily extends Model
{
    protected $fillable = [
        'entry_id',
        'shelter_id',
        'individuals_count',
        'contact',
        'wife_name',
        'children_info',
        'assistance_type',
        'provider',
        'date_received',
        'notes',
        'return_possible',
        'previous_assistance',
        'images',
        'family_book_number',
        'children_under_8_months',
        'birth_details',
    ];

    protected $casts = [
        'images' => 'array',
    ];

    public function needs(): BelongsToMany
    {
        return $this->belongsToMany(Need::class, 'displaced_family_needs')
            ->withPivot(['is_fulfilled', 'status', 'notes']) // Added 'status' here
            ->withTimestamps();
    }

    public function entry(): BelongsTo
    {
        return $this->belongsTo(Entry::class);
    }

    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class);
    }
}

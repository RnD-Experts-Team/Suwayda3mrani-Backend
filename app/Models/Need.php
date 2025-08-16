<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Need extends Model
{
    protected $fillable = [
        'name',
        'name_ar',
    ];

    public function displacedFamilies(): BelongsToMany
    {
        return $this->belongsToMany(DisplacedFamily::class, 'displaced_family_needs')
            ->withPivot(['is_fulfilled', 'status', 'notes']) // Added 'status' here
            ->withTimestamps();
    }
}

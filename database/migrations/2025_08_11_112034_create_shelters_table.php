<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This table stores shelter/hosting information from the form submission.
     * Data comes from these sections of the JSON:
     * - "مكانالإيواء" (Shelter locations array)
     * - "أولابياناتالمضيف" (Host family data)
     */
    public function up(): void
    {
        Schema::create('shelters', function (Blueprint $table) {
            // Automatic ID field
            $table->id();

            // Relationship to form entry (not directly from form data)
            $table->foreignId('entry_id')->constrained()->onDelete('cascade');

            // Location/place - comes from either:
            // 1. "مكانالإيواء[X]/مكانالإيواءاوالاجار" (from shelter locations array)
            // OR
            // 2. "أولابياناتالمضيف/مكانالتواجد" (from host family data - example: "قرية")
            $table->string('place')->nullable();

            // Contact information - comes from:
            // "مكانالإيواء[X]/رقمالتواصل" (from shelter locations array)
            $table->string('contact')->nullable();

            // Shelter images (stored as JSON) - comes from:
            // "مكانالإيواء[X]/صورةاوفيديوللمنزلالمتضررانوجد2" array
            // Contains array of image URLs and metadata
            $table->text('images')->nullable();

            // Automatic timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shelters');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This table stores martyr information from the form submission.
     * Data comes from the "أسماءالشهداء" (Martyrs names) array in the JSON.
     * Each record corresponds to one martyr in the array.
     */
    public function up(): void
    {
        Schema::create('martyrs', function (Blueprint $table) {
            // Automatic ID field
            $table->id();

            // Relationship to form entry (not directly from form data)
            $table->foreignId('entry_id')->constrained()->onDelete('cascade');

            // Martyr's full name - comes from:
            // "أسماءالشهداء[X]/اسمالشهيد/FirstAndLast"
            // Example: "Martyr1 tttt", "Martyr2 rrrr"
            $table->string('name')->nullable();

            // Martyr's age - comes from:
            // "أسماءالشهداء[X]/العمر"
            // Example: 25, 23
            $table->string('age');

            // Place of martyrdom - comes from:
            // "أسماءالشهداء[X]/مكانالاستشهاد"
            // Example: "here 1", "rtrtrtr"
            $table->string('place');

            // Relative's contact info - comes from:
            // "أسماءالشهداء[X]/اسماحدالاقاربمعرقمللتواصل"
            // Example: "trtrtrt", "rtrtrt"
            $table->string('relative_contact');

            // Martyr's image - comes from:
            // "أسماءالشهداء[X]/صورةللشهيدانوجد" array
            // Will store the first image URL as string or all as JSON
            // Example: "https://www.cognitoforms.com/fa/.../Screenshot-2025-08-11-094559.png"
            $table->text('image')->nullable();

            // Automatic timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('martyrs');
    }
};

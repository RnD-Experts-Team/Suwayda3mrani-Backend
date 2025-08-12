<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This table stores the main form entry metadata from the JSON submission.
     * Data comes from the root level and "Entry" section of the JSON.
     */
    public function up(): void
    {
        Schema::create('entries', function (Blueprint $table) {
            // Automatic ID field
            $table->id();

            // Form ID - comes from:
            // "Form/Id"
            // Example: "271"
            $table->string('form_id');

            // Entry number - comes from:
            // "Entry/Number"
            // Example: 159
            $table->integer('entry_number');

            // Submission date - comes from:
            // "Entry/DateSubmitted"
            // Example: "2025-08-11T15:02:18.682Z"
            $table->string('date_submitted');

            // Submitter's name - comes from:
            // "All/اسمك/FirstAndLast"
            // Example: "rnd test"
            $table->string('submitter_name')->nullable();

            // Location - comes from either:
            // 1. "All/مكانالتواجد" (Host family location)
            // OR
            // 2. "All/مكانالتواجد" (General location)
            // Example: "قرية", "عائلة مضيفة"
            $table->string('location')->nullable();

            // Status/conditions - comes from:
            // "All/الحالة" array (Conditions array)
            // Will store as JSON: ["منازل محترقة","منازل مسروقة","أسماء ضحايا","نزوح"]
            $table->string('status')->nullable();

            // Internal form link - comes from:
            // "Entry/InternalLink"
            // Example: "https://www.cognitoforms.com/NVT16/فورمتوثيق#f60DS_tKGnQC3MSnXHaB3fokQln7kodchN8i9R8sQgs$*"
            $table->string('internal_link')->nullable();

            // Automatic timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('entries');
    }
};


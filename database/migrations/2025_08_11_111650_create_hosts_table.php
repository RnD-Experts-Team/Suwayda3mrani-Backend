<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This table stores host family information from the form submission.
     * Data comes from the "أولابياناتالمضيف" (Host Family Data) section in the JSON.
     */
    public function up(): void
    {
        Schema::create('hosts', function (Blueprint $table) {
            // Automatic ID field
            $table->id();

            // Relationship to form entry (not directly from form data)
            $table->foreignId('entry_id')->constrained()->onDelete('cascade');

            // Host's full name - comes from:
            // "أولابياناتالمضيف/الاسمالكاملللمضيف/FirstAndLast"
            // Example: "host 1 host"
            $table->string('full_name')->nullable();

            // Number of family members - comes from:
            // "أولابياناتالمضيف/عددأفرادعائلةالمضيفمعأعمارهم"
            // Example: "1" (Note: stored as integer but comes as string)
            $table->string('family_count');

            // Location - comes from:
            // "أولابياناتالمضيف/مكانالتواجد"
            // Example: "قرية"
            $table->string('location');

            // Address - comes from:
            // "أولابياناتالمضيف/العنوان"
            // Example: "123"
            $table->string('address');

            // Phone number - comes from:
            // "أولابياناتالمضيف/رقمالهاتف2"
            // Example: "123123123"
            $table->string('phone');

            // Family book number - comes from:
            // "أولابياناتالمضيف/رقمدفترالعائلةإنوجد"
            // Example: 123
            $table->string('family_book_number')->nullable();

            // Internal form link - comes from:
            // "Entry/InternalLink"
            // Example: "https://www.cognitoforms.com/NVT16/فورمتوثيق#f60DS_tKGnQC3MSnXHaB3fokQln7kodchN8i9R8sQgs$*"
            $table->string('internal_link')->nullable();

            $table->string('children_under_8_months');

            // Automatic timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hosts');
    }
};

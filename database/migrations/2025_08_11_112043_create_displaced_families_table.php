<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This table stores data about displaced families from the form submission.
     * Each record corresponds to one family in the "Hosted Families" section (ثانياالعائلةالمستضافة array)
     */
    public function up(): void
    {
        Schema::create('displaced_families', function (Blueprint $table) {
            // Automatic ID field
            $table->id();

            // Relationships
            $table->foreignId('shelter_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('entry_id')->nullable()->constrained()->onDelete('cascade');

            // Family information
            $table->string('individuals_count');
            $table->string('contact');
            $table->string('wife_name');
            $table->text('children_info');
            $table->string('family_book_number')->nullable();

            // Needs and assistance
            $table->text('needs')->nullable();
            $table->string('assistance_type')->nullable();
            $table->string('provider')->nullable();
            $table->string('date_received')->nullable();
            $table->text('notes')->nullable();

            // Status flags
            $table->string('return_possible'); // 'نعم' or 'لا'
            $table->string('previous_assistance'); // 'نعم' or 'لا'

            // Documentation
            $table->json('images')->nullable();

            // Automatic timestamps
            $table->timestamps();

            // Indexes for better performance
            $table->index('shelter_id');
            $table->index('entry_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('displaced_families');
    }
};

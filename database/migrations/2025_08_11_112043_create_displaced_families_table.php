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
            $table->string('individuals_count')->nullable();
            $table->string('contact')->nullable();
            $table->string('wife_name')->nullable();
            $table->text('children_info')->nullable();
            $table->string('family_book_number')->nullable();

            // Assistance information (removed 'needs' column since using pivot table)
            $table->string('assistance_type')->nullable();
            $table->string('provider')->nullable();
            $table->string('date_received')->nullable();
            $table->text('notes')->nullable();


            // Status flags
            $table->string('return_possible')->nullable(); // 'نعم' or 'لا'
            $table->string('previous_assistance')->nullable(); // 'نعم' or 'لا'

            // Documentation
            $table->json('images')->nullable();

            // Children information
            $table->string('children_under_8_months')->nullable();
            $table->text('birth_details')->nullable(); // Added missing field

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

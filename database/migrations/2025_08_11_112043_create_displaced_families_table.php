<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('displaced_families', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shelter_id')->constrained()->onDelete('cascade');
            $table->string('individuals_count')->nullable();
            $table->string('contact')->nullable();
            $table->string('wife_name')->nullable();
            $table->text('children_info')->nullable();
            $table->string('needs')->nullable(); // Store choices as JSON
            $table->string('assistance_type')->nullable();
            $table->string('provider')->nullable();
            $table->string('date_received')->nullable();
            $table->text('notes')->nullable();
            $table->string('return_possible')->nullable();
            $table->string('previous_assistance')->nullable();
            $table->text('images')->nullable(); // Store as JSON string
            $table->string('family_book_number')->nullable();
            $table->timestamps();
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

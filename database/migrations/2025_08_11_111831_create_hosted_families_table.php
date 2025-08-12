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
        Schema::create('hosted_families', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_id')->constrained()->onDelete('cascade');
            $table->string('individuals_count');
            $table->string('contact');
            $table->string('wife_name');
            $table->text('children_info');
            $table->string('needs')->nullable(); // Store choices as JSON
            $table->string('assistance_type')->nullable();
            $table->string('provider')->nullable();
            $table->string('date_received')->nullable();
            $table->text('notes')->nullable();
            $table->string('return_possible');
            $table->string('previous_assistance');
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
        Schema::dropIfExists('hosted_families');
    }
};

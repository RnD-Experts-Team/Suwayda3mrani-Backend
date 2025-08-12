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
        Schema::create('hosts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry_id')->constrained()->onDelete('cascade');
            $table->string('full_name')->nullable(); // Store FirstAndLast as string
            $table->integer('family_count');
            $table->string('location');
            $table->string('address');
            $table->string('phone');
            $table->string('family_book_number')->nullable();
            $table->string('internal_link')->nullable(); // Store CognitoForms link
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

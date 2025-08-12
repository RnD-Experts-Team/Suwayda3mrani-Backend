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
        Schema::create('entries', function (Blueprint $table) {
            $table->id();
            $table->string('form_id');
            $table->integer('entry_number');
            $table->string('date_submitted');
            $table->string('submitter_name')->nullable(); // Store FirstAndLast as string
            $table->string('location')->nullable();
            $table->string('status')->nullable(); // Store as JSON string or comma-separated
            $table->string('internal_link')->nullable(); // Store CognitoForms link
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

<?php
// Migration: create_home_sections_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('home_sections', function (Blueprint $table) {
            $table->id();
            $table->string('section_id')->unique(); // e.g., 'hero-1', 'suggestion-1'
            $table->enum('type', ['hero', 'suggestion']);
            $table->string('title_key')->nullable(); // localization key
            $table->string('description_key')->nullable(); // localization key
            $table->string('button_text_key')->nullable(); // localization key
            $table->string('button_variant')->nullable(); // 'outline', 'solid', etc.
            $table->string('action_key')->nullable(); // 'takeAction', 'shareTestimony', etc.
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['type', 'is_active', 'sort_order']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('home_sections');
    }
};

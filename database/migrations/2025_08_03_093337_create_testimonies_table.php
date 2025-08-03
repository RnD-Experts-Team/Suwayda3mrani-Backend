<?php
// Migration: create_testimonies_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('testimonies', function (Blueprint $table) {
            $table->id();
            $table->string('testimony_id')->unique(); // e.g., 'testimonial-1'
            $table->string('category_key')->nullable(); // localization key for category
            $table->string('title_key'); // localization key for title
            $table->text('description_key'); // localization key for description
            $table->string('survivor_name')->nullable();
            $table->integer('survivor_age')->nullable();
            $table->string('survivor_location')->nullable();
            $table->date('date_of_incident')->nullable();
            $table->string('background_image_path')->nullable();
            $table->string('url_slug')->unique();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false); // Featured on home screen
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['is_active', 'is_featured', 'sort_order']);
            $table->index(['url_slug']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('testimonies');
    }
};

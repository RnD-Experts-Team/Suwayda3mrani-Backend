<?php
// Migration: create_media_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('media_id')->unique(); // e.g., 'media-1', 'media-2'
            $table->enum('type', ['image', 'video']);
            $table->enum('source_type', ['upload', 'google_drive', 'external_link']);
            
            // For uploaded files
            $table->string('file_path')->nullable();
            
            // For Google Drive files
            $table->string('google_drive_id')->nullable();
            
            // For external links
            $table->text('external_url')->nullable();
            
            $table->string('thumbnail_path')->nullable(); // Thumbnail for videos or smaller images
            $table->string('title_key')->nullable(); // localization key for title
            $table->string('description_key')->nullable(); // localization key for description
            $table->string('source_url')->nullable(); // External source URL for attribution
            $table->boolean('is_active')->default(true);
            $table->boolean('featured_on_home')->default(false); // Show on home screen
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['type', 'is_active', 'featured_on_home']);
            $table->index(['featured_on_home', 'is_active']);
            $table->index(['source_type', 'is_active']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('media');
    }
};

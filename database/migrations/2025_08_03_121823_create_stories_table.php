<?php
// database/migrations/create_stories_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('stories', function (Blueprint $table) {
            $table->id();
            $table->string('story_id')->unique(); // story-2024-001
            $table->string('title_key'); // For localization
            $table->text('description_key'); // For localization
            $table->string('background_image_path')->nullable();
            $table->string('url_slug')->unique();
            $table->string('external_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->json('metadata')->nullable(); // For storing additional data
            $table->timestamps();

            $table->index(['is_active', 'is_featured']);
            $table->index('sort_order');
        });
    }

    public function down()
    {
        Schema::dropIfExists('stories');
    }
};

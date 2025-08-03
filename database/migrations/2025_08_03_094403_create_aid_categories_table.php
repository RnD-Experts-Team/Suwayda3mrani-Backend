<?php
// Migration: create_aid_categories_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('aid_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name_key'); // localization key for category name
            $table->string('slug')->unique(); // 'food', 'clothing', 'medical'
            $table->string('icon')->nullable(); // Icon name/class
            $table->string('color')->nullable(); // Hex color code
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('aid_categories');
    }
};

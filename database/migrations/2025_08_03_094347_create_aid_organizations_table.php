<?php
// Migration: create_aid_organizations_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('aid_organizations', function (Blueprint $table) {
            $table->id();
            $table->string('organization_id')->unique(); // e.g., 'aid-org-1'
            $table->string('name_key'); // localization key for name
            $table->text('description_key'); // localization key for description
            $table->string('background_image_path')->nullable();
            $table->string('website_url')->nullable();
            $table->string('contact_url')->nullable();
            $table->enum('type', ['organizations', 'initiatives'])->default('organizations');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false); // Featured on home screen
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['type', 'is_active', 'sort_order']);
            $table->index(['is_featured', 'is_active']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('aid_organizations');
    }
};

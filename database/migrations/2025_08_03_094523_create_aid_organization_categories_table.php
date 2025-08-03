<?php
// Migration: create_aid_organization_categories_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('aid_organization_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aid_organization_id')->constrained()->onDelete('cascade');
            $table->foreignId('aid_category_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            $table->unique(['aid_organization_id', 'aid_category_id'], 'org_category_unique');
        });
    }

    public function down()
    {
        Schema::dropIfExists('aid_organization_categories');
    }
};

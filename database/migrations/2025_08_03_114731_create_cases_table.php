<?php
// database/migrations/create_cases_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('cases', function (Blueprint $table) {
            $table->id();
            $table->string('case_id')->unique(); // case-2024-001
            $table->enum('type', ['deaths', 'houses', 'migrations', 'thefts']);
            $table->string('title_key'); // For localization
            $table->string('url_slug')->unique();
            $table->string('external_url')->nullable(); // For linking to external documentation
            $table->date('incident_date');
            $table->string('location')->nullable();
            $table->text('description_key')->nullable(); // For localization
            $table->json('metadata')->nullable(); // For storing case-specific data
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['type', 'is_active']);
            $table->index(['is_featured', 'is_active']);
            $table->index('incident_date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('cases');
    }
};

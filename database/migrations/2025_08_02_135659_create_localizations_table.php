<?php
// database/migrations/create_localizations_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('localizations', function (Blueprint $table) {
            $table->id();
            $table->string('language', 5); // en, ar, fr, etc.
            $table->string('group')->nullable(); // navigation, buttons, footer, etc.
            $table->string('key'); // home, title, seeStories, etc.
            $table->text('value'); // The actual translation
            $table->text('description')->nullable(); // Optional description for translators
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Composite unique index to prevent duplicates
            $table->unique(['language', 'group', 'key'], 'unique_localization');
            
            // Indexes for performance
            $table->index(['language', 'group']);
            $table->index(['language', 'is_active']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('localizations');
    }
};

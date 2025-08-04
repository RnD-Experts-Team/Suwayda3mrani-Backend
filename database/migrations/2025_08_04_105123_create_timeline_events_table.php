<?php
// database/migrations/2025_08_04_100000_create_timeline_events_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTimelineEventsTable extends Migration
{
    public function up()
    {
        Schema::create('timeline_events', function (Blueprint $table) {
            $table->id();
            $table->string('timeline_event_id')->unique(); // timeline-event-001
            $table->string('title_key');
            $table->string('period'); // "1980s - 1990", "1994", etc.
            $table->text('description_key');
            $table->boolean('is_highlighted')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('timeline_events');
    }
}

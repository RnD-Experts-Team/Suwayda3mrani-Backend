<?php
// database/migrations/create_case_details_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('case_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('cases')->onDelete('cascade');
            $table->string('key_localization_key'); // For localized detail keys (Location, Date, etc.)
            $table->string('value_localization_key'); // For localized detail values
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['case_id', 'sort_order']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('case_details');
    }
};

<?php
// database/migrations/xxxx_xx_xx_create_displaced_family_needs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('displaced_family_needs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('displaced_family_id')->constrained()->onDelete('cascade');
            $table->foreignId('need_id')->constrained()->onDelete('cascade');
            $table->boolean('is_fulfilled')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['displaced_family_id', 'need_id']);
            $table->index(['displaced_family_id', 'need_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('displaced_family_needs');
    }
};

<?php
// Migration: create_media_relations_table.php
// This table will link media to testimonies, cases, etc.

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('media_relations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('media_id')->constrained('media')->onDelete('cascade');
            $table->morphs('mediable'); // This creates mediable_type and mediable_id
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            
            $table->unique(['media_id', 'mediable_type', 'mediable_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('media_relations');
    }
};

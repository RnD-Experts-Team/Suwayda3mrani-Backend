<?php
// database/migrations/xxxx_xx_xx_add_notes_to_entries_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('entries', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('internal_link');
        });
    }

    public function down()
    {
        Schema::table('entries', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};

<?php
// database/migrations/xxxx_xx_xx_add_status_to_displaced_family_needs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('displaced_family_needs', function (Blueprint $table) {
            $table->enum('status', ['pending', 'fulfilled', 'given'])->default('pending')->after('is_fulfilled');
        });
    }

    public function down()
    {
        Schema::table('displaced_family_needs', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};

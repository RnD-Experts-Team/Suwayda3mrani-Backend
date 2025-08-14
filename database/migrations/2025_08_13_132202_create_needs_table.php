<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('needs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('name_ar');
            $table->timestamps();
        });

        // Insert the predefined needs
        DB::table('needs')->insert([
            ['name' => 'additional_shelter', 'name_ar' => 'مأوى إضافي', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'food', 'name_ar' => 'طعام', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'clean_water', 'name_ar' => 'مياه نظيفة', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'medical_services', 'name_ar' => 'أدوية / خدمات صحية', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'clothing', 'name_ar' => 'ملابس', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'bedding_blankets', 'name_ar' => 'فرش / بطانيات', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'psychological_support', 'name_ar' => 'دعم نفسي', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'financial_support', 'name_ar' => 'دعم مالي', 'created_at' => now(), 'updated_at' => now()],
        ]);


        // Skip the old data migration since the 'needs' column no longer exists
        // and we're working with a fresh structure
    }

    public function down(): void
    {
        Schema::dropIfExists('needs');
    }
};

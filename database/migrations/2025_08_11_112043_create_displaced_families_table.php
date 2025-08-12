<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This table stores data about displaced families from the form submission.
     * Each record corresponds to one family in the "Hosted Families" section (ثانياالعائلةالمستضافة array)
     */
    public function up(): void
    {
        Schema::create('displaced_families', function (Blueprint $table) {
            // Automatic ID field
            $table->id();

            // Relationship to shelter (not directly from form data)
            $table->foreignId('shelter_id')->constrained()->onDelete('cascade');

            // Number of family members - comes from: ثانياالعائلةالمستضافة[X]/عددالأفراد
            // Example values: "123", "test 2"
            $table->string('individuals_count')->nullable();

            // Family head contact info - comes from: ثانياالعائلةالمستضافة[X]/اسمربالعائلةرقمالتواصل
            // Example values: "123", "test2 father of famely"
            $table->string('contact')->nullable();

            // Wife's name - comes from: ثانياالعائلةالمستضافة[X]/اسمالزوجة
            // Example values: "123", "test2"
            $table->string('wife_name')->nullable();

            // Children information - comes from: ثانياالعائلةالمستضافة[X]/أسماءوأعمارالأطفال
            // Example values: "123", "test 2"
            $table->text('children_info')->nullable();

            // Family needs (stored as JSON) - comes from: ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/يرجىاختيارالاحتياجات
            // Example values: ["مأوى إضافي","طعام","مياه نظيفة"...]
            $table->string('needs')->nullable();

            // Type of assistance received - comes from: ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/نوعالمساعدة
            // Example value: "test of kiend"
            $table->string('assistance_type')->nullable();

            // Assistance provider - comes from: ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/الجهةالمقدمةللمساعدة
            // Example value: "test"
            $table->string('provider')->nullable();

            // Date assistance received - comes from: ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/تاريخالحصولعليها
            // Example value: "123"
            $table->string('date_received')->nullable();

            // Additional notes - comes from: ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/ملاحظاتإضافية
            // Example values: "rtrt", "123123"
            $table->text('notes')->nullable();

            // Can return home? - comes from: ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/إمكانيةالعودةللمنزل2
            // Values: "نعم" (yes) or "لا" (no)
            $table->string('return_possible')->nullable();

            // Previous assistance received? - comes from: ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/هلتمتلقيمساعداتسابقة2
            // Values: "نعم" (yes) or "لا" (no)
            $table->string('previous_assistance')->nullable();

            // Documentation images (stored as JSON) - comes from: ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/صوراوفيديوهاتللتوثيق2
            // Contains array of image URLs and metadata
            $table->text('images')->nullable();

            // Family book number - comes from: ثانياالعائلةالمستضافة[X]/رقمدفترالعائلةإنوجد
            // Example value: "123"
            $table->string('family_book_number')->nullable();

            // Automatic timestamps
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('displaced_families');
    }
};

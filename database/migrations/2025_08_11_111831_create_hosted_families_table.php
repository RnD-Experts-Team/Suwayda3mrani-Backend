<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This table stores data about families being hosted, from the form's:
     * "ثانياالعائلةالمستضافة" (Hosted Families) array
     * Each record corresponds to one hosted family in the array.
     */
    public function up(): void
    {
        Schema::create('hosted_families', function (Blueprint $table) {
            // Automatic ID field
            $table->id();

            // Relationship to form entry (not directly from form data)
            $table->foreignId('entry_id')->constrained()->onDelete('cascade');

            // Number of family members - from:
            // "ثانياالعائلةالمستضافة[X]/عددالأفراد"
            // Example values: "123", "test 2"
            $table->string('individuals_count');

            // Family head contact info - from:
            // "ثانياالعائلةالمستضافة[X]/اسمربالعائلةرقمالتواصل"
            // Example values: "123", "test2 father of famely"
            $table->string('contact');

            // Wife's name - from:
            // "ثانياالعائلةالمستضافة[X]/اسمالزوجة"
            // Example values: "123", "test2"
            $table->string('wife_name');

            // Children information - from:
            // "ثانياالعائلةالمستضافة[X]/أسماءوأعمارالأطفال"
            // Example values: "123", "test 2"
            $table->text('children_info');

            // Family needs (stored as JSON) - from:
            // "ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/يرجىاختيارالاحتياجات"
            // Example: ["مأوى إضافي","طعام","مياه نظيفة","أدوية / خدمات صحية"...]
            $table->string('needs')->nullable();

            // Type of assistance - from:
            // "ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/نوعالمساعدة"
            // Example: "test of kiend"
            $table->string('assistance_type')->nullable();

            // Assistance provider - from:
            // "ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/الجهةالمقدمةللمساعدة"
            // Example: "test"
            $table->string('provider')->nullable();

            // Date assistance received - from:
            // "ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/تاريخالحصولعليها"
            // Example: "123"
            $table->string('date_received')->nullable();

            // Additional notes - from:
            // "ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/ملاحظاتإضافية"
            // Example: "rtrt", "123123"
            $table->text('notes')->nullable();

            // Can return home? - from:
            // "ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/إمكانيةالعودةللمنزل2"
            // Values: "نعم" (Yes) or "لا" (No)
            $table->string('return_possible');

            // Previous assistance received? - from:
            // "ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/هلتمتلقيمساعداتسابقة2"
            // Values: "نعم" (Yes) or "لا" (No)
            $table->string('previous_assistance');

            // Documentation images (stored as JSON) - from:
            // "ثانياالعائلةالمستضافة[X]/الاحتياجاتالحاليةللعائلاتالمستضافة/صوراوفيديوهاتللتوثيق2"
            // Contains array of image objects with URLs and metadata
            $table->text('images')->nullable();

            // Family book number - from:
            // "ثانياالعائلةالمستضافة[X]/رقمدفترالعائلةإنوجد"
            // Example: "123"
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
        Schema::dropIfExists('hosted_families');
    }
};

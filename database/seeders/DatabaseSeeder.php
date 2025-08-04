<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            // Core system data
            LocalizationSeeder::class,
            AidCategorySeeder::class,
            
            // Page content
            AboutPageLocalizationsSeeder::class,
            AidEffortsLocalizationsSeeder::class,
            TestimonialsPageLocalizationsSeeder::class,
            OrganizationDetailLocalizationsSeeder::class,
            TestimonyDetailLocalizationsSeeder::class,
            
            // Main content
            MediaSeeder::class,
            AidOrganizationSeeder::class,
            TestimonySeeder::class,
            StorySeeder::class,
            CasesSeeder::class,
            HomeSectionSeeder::class,
            
            // Relations (run last)
            MediaRelationSeeder::class,
        ]);
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class FoodSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('food')->insert([
            // Fruits
            [
                'name' => 'Apple',
                'calories' => 52,
                'protein' => 0.3,
                'carbohydrates' => 14.0,
                'fat' => 0.2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Banana',
                'calories' => 89,
                'protein' => 1.1,
                'carbohydrates' => 22.8,
                'fat' => 0.3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Avocado',
                'calories' => 160,
                'protein' => 2.0,
                'carbohydrates' => 8.5,
                'fat' => 14.7,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Proteins
            [
                'name' => 'Chicken Breast',
                'calories' => 165,
                'protein' => 31.0,
                'carbohydrates' => 0.0,
                'fat' => 3.6,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Salmon',
                'calories' => 208,
                'protein' => 20.4,
                'carbohydrates' => 0.0,
                'fat' => 13.4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Egg (Whole)',
                'calories' => 155,
                'protein' => 12.6,
                'carbohydrates' => 1.1,
                'fat' => 10.6,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Vegetables & Legumes
            [
                'name' => 'Broccoli',
                'calories' => 34,
                'protein' => 2.8,
                'carbohydrates' => 6.6,
                'fat' => 0.4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Spinach',
                'calories' => 23,
                'protein' => 2.9,
                'carbohydrates' => 3.6,
                'fat' => 0.4,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Grains & Carbs
            [
                'name' => 'White Rice (Cooked)',
                'calories' => 130,
                'protein' => 2.7,
                'carbohydrates' => 28.2,
                'fat' => 0.3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Oats (Dry)',
                'calories' => 389,
                'protein' => 16.9,
                'carbohydrates' => 66.3,
                'fat' => 6.9,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sweet Potato',
                'calories' => 86,
                'protein' => 1.6,
                'carbohydrates' => 20.1,
                'fat' => 0.1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Nuts & Seeds
            [
                'name' => 'Almonds',
                'calories' => 579,
                'protein' => 21.2,
                'carbohydrates' => 21.7,
                'fat' => 49.9,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
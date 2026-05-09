<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * 
     * WARNING: This creates a default admin user. 
     * IMPORTANT: Change the password immediately after first login!
     */
    public function run(): void
    {
        // Create default admin user with environment-based password
        User::factory()->create([
            'name' => 'Admin NetBilling',
            'username' => env('ADMIN_USERNAME', 'admin'),
            'email' => env('ADMIN_EMAIL', 'admin@netbilling.local'),
            'password' => bcrypt(env('ADMIN_PASSWORD', 'change-me-immediately')),
            'role' => 'pemilik',
        ]);

        // Log warning in production
        if (app()->isProduction()) {
            \Log::warning('Default admin user created. Email: ' . env('ADMIN_EMAIL', 'admin@netbilling.local'));
        }
    }
}

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
        // Create default users with admin1234
        User::factory()->create([
            'name' => 'Pemilik NetBilling',
            'username' => 'pemilik',
            'email' => 'pemilik@netbilling.local',
            'password' => bcrypt('admin1234'),
            'role' => 'pemilik',
        ]);

        User::factory()->create([
            'name' => 'Admin NetBilling',
            'username' => 'admin',
            'email' => 'admin@netbilling.local',
            'password' => bcrypt('admin1234'),
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Teknisi NetBilling',
            'username' => 'teknisi',
            'email' => 'teknisi@netbilling.local',
            'password' => bcrypt('admin1234'),
            'role' => 'teknisi',
        ]);

        // Log warning in production
        if (app()->isProduction()) {
            \Log::warning('Default admin user created. Password is admin1234.');
        }

        // Seed Production / Migrated Demo Data
        $this->call(ProductionDataSeeder::class);
    }
}

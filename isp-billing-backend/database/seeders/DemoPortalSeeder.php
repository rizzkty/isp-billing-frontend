<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Package;
use App\Models\Ticket;
use Carbon\Carbon;

class DemoPortalSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil atau buat Paket
        $package = Package::first();
        if (!$package) {
            $package = Package::create([
                'name' => 'SOHO 50 Mbps',
                'speed' => '50 Mbps',
                'price' => 350000,
            ]);
        }

        // 2. Buat Customer Demo
        $customer = Customer::updateOrCreate(
            ['customer_id' => 'CUST-DEMO'],
            [
                'name' => 'Pelanggan Demo (NetBilling)',
                'phone' => '081234567890',
                'email' => 'demo@netbilling.com',
                'address' => 'Jl. Digital No. 101, Jakarta',
                'status' => 'aktif',
                'installation_date' => now()->subMonths(6),
                'package_id' => $package->id,
                'package_name' => $package->name,
            ]
        );

        // 3. Buat Invoice Dummy
        // Bulan ini (Unpaid)
        Invoice::updateOrCreate(
            ['customer_id' => $customer->id, 'month' => now()->month, 'year' => now()->year],
            [
                'package_id' => $package->id,
                'amount' => $package->price,
                'status' => 'unpaid',
                'due_date' => now()->addDays(5),
                'notes' => 'Tagihan internet bulan ' . now()->format('F'),
            ]
        );

        // Bulan lalu (Paid)
        Invoice::updateOrCreate(
            ['customer_id' => $customer->id, 'month' => now()->subMonth()->month, 'year' => now()->subMonth()->year],
            [
                'package_id' => $package->id,
                'amount' => $package->price,
                'status' => 'paid',
                'due_date' => now()->subMonth()->startOfMonth()->addDays(10),
                'xendit_paid_at' => now()->subMonth()->startOfMonth()->addDays(2),
                'payment_method' => 'VA_BCA',
                'notes' => 'Tagihan internet bulan ' . now()->subMonth()->format('F'),
            ]
        );

        // 4. Buat Tiket Dummy
        Ticket::updateOrCreate(
            ['customer_id' => $customer->id, 'title' => 'Tanya upgrade kecepatan'],
            [
                'description' => 'Saya ingin upgrade dari 50 ke 100 Mbps, berapa biayanya?',
                'category' => 'Billing',
                'priority' => 'Low',
                'status' => 'closed',
                'created_by' => 'customer_portal',
            ]
        );
    }
}

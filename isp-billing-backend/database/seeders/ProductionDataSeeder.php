<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Package;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Ticket;
use App\Models\NetworkNode;
use App\Models\NetworkEdge;
use Carbon\Carbon;

class ProductionDataSeeder extends Seeder
{
    public function run()
    {
        // 1. Wipe old data (truncate)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        NetworkEdge::truncate();
        NetworkNode::truncate();
        Ticket::truncate();
        Invoice::truncate();
        Customer::truncate();
        Package::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 2. Create Packages
        $pkg20 = Package::create(['name' => 'Home 20 Mbps', 'speed' => '20 Mbps', 'download' => 20, 'upload' => 10, 'profile' => 'Profile-20M', 'price' => 250000, 'status' => 'Aktif']);
        $pkg50 = Package::create(['name' => 'SOHO 50 Mbps', 'speed' => '50 Mbps', 'download' => 50, 'upload' => 25, 'profile' => 'Profile-50M', 'price' => 350000, 'status' => 'Aktif']);
        $pkg100 = Package::create(['name' => 'Business 100 Mbps', 'speed' => '100 Mbps', 'download' => 100, 'upload' => 100, 'profile' => 'Profile-100M', 'price' => 550000, 'status' => 'Aktif']);

        // 3. Create 3 Real Customers (from Demo)
        $agus = Customer::create([
            'customer_id' => 'CUST-DEMO-01', 
            'name' => 'Agus SOHO', 
            'email' => 'agus@demo.com', 
            'phone' => '08123456789', 
            'address' => 'Jl. Demo No. 1, Jakarta', 
            'status' => 'aktif', 
            'ip_address' => '10.20.30.101', 
            'package_name' => 'SOHO 50 Mbps', 
            'package_id' => $pkg50->id,
            'installation_date' => '2026-01-01',
            'latitude' => -8.167,
            'longitude' => 113.682
        ]);

        $budi = Customer::create([
            'customer_id' => 'CUST-DEMO-02', 
            'name' => 'Budi Home', 
            'email' => 'budi@demo.com', 
            'phone' => '08123456780', 
            'address' => 'Jl. Demo No. 2, Bandung', 
            'status' => 'aktif', 
            'ip_address' => '10.20.30.102', 
            'package_name' => 'Home 20 Mbps', 
            'package_id' => $pkg20->id,
            'installation_date' => '2026-02-15',
            'latitude' => -8.164,
            'longitude' => 113.679
        ]);

        $hani = Customer::create([
            'customer_id' => 'CUST-DEMO-08', 
            'name' => 'Hani Home', 
            'email' => 'hani@demo.com', 
            'phone' => '08123456786', 
            'address' => 'Jl. Demo No. 8, Bogor', 
            'status' => 'terisolir', 
            'ip_address' => '10.20.30.108', 
            'package_name' => 'Home 20 Mbps', 
            'package_id' => $pkg20->id,
            'installation_date' => '2026-04-20',
            'latitude' => -8.168,
            'longitude' => 113.683
        ]);

        // 4. Create Invoices
        $now = Carbon::now();
        // Agus (Paid)
        Invoice::create([
            'customer_id' => $agus->id, 'package_id' => $pkg50->id, 'amount' => $pkg50->price,
            'status' => 'paid', 'month' => $now->month, 'year' => $now->year,
            'due_date' => $now->copy()->startOfMonth()->addDays(10)->toDateString(),
            'created_at' => $now->copy()->subDays(5)
        ]);

        // Budi (Unpaid)
        Invoice::create([
            'customer_id' => $budi->id, 'package_id' => $pkg20->id, 'amount' => $pkg20->price,
            'status' => 'unpaid', 'month' => $now->month, 'year' => $now->year,
            'due_date' => $now->copy()->startOfMonth()->addDays(10)->toDateString(),
            'created_at' => $now->copy()->subDays(20)
        ]);

        // Hani (Unpaid - Isolir)
        Invoice::create([
            'customer_id' => $hani->id, 'package_id' => $pkg20->id, 'amount' => $pkg20->price,
            'status' => 'unpaid', 'month' => $now->copy()->subMonth()->month, 'year' => $now->year,
            'due_date' => $now->copy()->subMonth()->startOfMonth()->addDays(10)->toDateString(),
            'created_at' => $now->copy()->subDays(45)
        ]);
        Invoice::create([
            'customer_id' => $hani->id, 'package_id' => $pkg20->id, 'amount' => $pkg20->price,
            'status' => 'unpaid', 'month' => $now->month, 'year' => $now->year,
            'due_date' => $now->copy()->startOfMonth()->addDays(10)->toDateString(),
            'created_at' => $now->copy()->subDays(20)
        ]);

        // 5. Create Network Nodes & Edges
        $server = NetworkNode::create(['name' => 'SERVER Jember', 'type' => 'server', 'lat' => -8.170, 'lng' => 113.700, 'status' => 'aktif']);
        $odcSuko = NetworkNode::create(['name' => 'ODC Sukorambi', 'type' => 'odc', 'lat' => -8.165, 'lng' => 113.680, 'parent_id' => $server->id, 'status' => 'aktif']);
        $odp1 = NetworkNode::create(['name' => 'ODP 1 Sukorambi', 'type' => 'odp', 'lat' => -8.166, 'lng' => 113.681, 'parent_id' => $odcSuko->id, 'status' => 'aktif', 'max_ports' => 8]);

        NetworkEdge::create(['from_node_id' => $server->id, 'to_node_id' => $odcSuko->id, 'type' => 'Backbone', 'cable_color' => '#1d4ed8']);
        NetworkEdge::create(['from_node_id' => $odcSuko->id, 'to_node_id' => $odp1->id, 'type' => 'Distribution', 'cable_color' => '#059669']);

        // Agus Node
        $agusNode = NetworkNode::create(['name' => $agus->name, 'type' => 'customer', 'lat' => -8.167, 'lng' => 113.682, 'parent_id' => $odp1->id, 'customer_id' => $agus->id, 'status' => 'aktif']);
        NetworkEdge::create(['from_node_id' => $odp1->id, 'to_node_id' => $agusNode->id, 'type' => 'Distribution', 'cable_color' => '#4b5563']);

        // Budi Node
        $budiNode = NetworkNode::create(['name' => $budi->name, 'type' => 'customer', 'lat' => -8.164, 'lng' => 113.679, 'parent_id' => $odp1->id, 'customer_id' => $budi->id, 'status' => 'aktif']);
        NetworkEdge::create(['from_node_id' => $odp1->id, 'to_node_id' => $budiNode->id, 'type' => 'Distribution', 'cable_color' => '#4b5563']);

        // Hani Node
        $haniNode = NetworkNode::create(['name' => $hani->name, 'type' => 'customer', 'lat' => -8.168, 'lng' => 113.683, 'parent_id' => $odp1->id, 'customer_id' => $hani->id, 'status' => 'los']);
        NetworkEdge::create(['from_node_id' => $odp1->id, 'to_node_id' => $haniNode->id, 'type' => 'Distribution', 'cable_color' => '#4b5563']);

        // 6. Create Tickets
        // Admin user check
        $admin = User::first() ?: User::factory()->create();

        Ticket::create([
            'title' => 'Indikator Modem Merah (LOS)',
            'description' => 'Pelanggan Hani melaporkan lampu PON berkedip merah dan tidak bisa koneksi internet.',
            'status' => 'open',
            'priority' => 'high',
            'customer_id' => $hani->id,
            'assigned_to' => $admin->id,
            'created_at' => $now->copy()->subHours(2)
        ]);

        Ticket::create([
            'title' => 'Koneksi Mati Total (Gangguan Massal ODC Patrang)',
            'description' => 'Tiba-tiba koneksi terputus. Tetangga sebelah juga mati.',
            'status' => 'in_progress',
            'priority' => 'urgent',
            'customer_id' => $budi->id,
            'assigned_to' => $admin->id,
            'created_at' => $now->copy()->subMinutes(45)
        ]);
    }
}

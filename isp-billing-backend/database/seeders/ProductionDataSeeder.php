<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Package;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Ticket;
use App\Models\NetworkNode;
use App\Models\NetworkEdge;

class ProductionDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Seeds 7 realistic customers (under 20) with various statuses:
     * - Paid (Lunas)
     * - Unpaid/Approaching Due Date (Mendekati Tenggat Bayar)
     * - Isolated (Terisolir)
     * Generates a 12-month payment history for each.
     * Connects all customers to their respective ODP node in the network map.
     */
    public function run()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        NetworkEdge::truncate();
        NetworkNode::truncate();
        Ticket::truncate();
        Invoice::truncate();
        Customer::truncate();
        Package::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // 1. Create Packages
        $pkg1 = Package::create([
            'name' => 'Home 20 Mbps',
            'speed' => 20,
            'price' => 250000,
            'description' => 'Paket internet rumah kuota tak terbatas 20 Mbps',
        ]);

        $pkg2 = Package::create([
            'name' => 'Home 50 Mbps',
            'speed' => 50,
            'price' => 350000,
            'description' => 'Paket internet cepat keluarga 50 Mbps',
        ]);

        $pkg3 = Package::create([
            'name' => 'Biz 100 Mbps',
            'speed' => 100,
            'price' => 750000,
            'description' => 'Paket internet dedicated kantor 100 Mbps',
        ]);

        // 2. Create Customers (installation dates set to 1+ years ago)
        $c1 = Customer::create([
            'customer_id' => 'CUST-2026-001',
            'package_id' => $pkg1->id,
            'name' => 'Rian Pratama',
            'address' => 'Jl. Mastrip No. 12, Jember',
            'phone' => '081234567890',
            'email' => 'rian.pratama@gmail.com',
            'package_name' => $pkg1->name,
            'ip_address' => '10.20.30.101',
            'status' => 'aktif',
            'installation_date' => '2025-04-10',
            'latitude' => -8.1675,
            'longitude' => 113.6820,
        ]);

        $c2 = Customer::create([
            'customer_id' => 'CUST-2026-002',
            'package_id' => $pkg1->id,
            'name' => 'Siti Aminah',
            'address' => 'Jl. Karimata Gg. Bersama No. 5, Jember',
            'phone' => '081234567891',
            'email' => 'siti.aminah@yahoo.com',
            'package_name' => $pkg1->name,
            'ip_address' => '10.20.30.102',
            'status' => 'aktif',
            'installation_date' => '2025-04-15',
            'latitude' => -8.1645,
            'longitude' => 113.6790,
        ]);

        $c3 = Customer::create([
            'customer_id' => 'CUST-2026-003',
            'package_id' => $pkg2->id,
            'name' => 'Budi Santoso',
            'address' => 'Jl. Jawa No. 8, Jember',
            'phone' => '081234567892',
            'email' => 'budi.santoso@outlook.com',
            'package_name' => $pkg2->name,
            'ip_address' => '10.20.30.103',
            'status' => 'aktif',
            'installation_date' => '2025-04-20',
            'latitude' => -8.1710,
            'longitude' => 113.6850,
        ]);

        $c4 = Customer::create([
            'customer_id' => 'CUST-2026-004',
            'package_id' => $pkg1->id,
            'name' => 'Diana Lestari',
            'address' => 'Jl. Kalimantan No. 44, Jember',
            'phone' => '081234567893',
            'email' => 'diana.lestari@gmail.com',
            'package_name' => $pkg1->name,
            'ip_address' => '10.20.30.104',
            'status' => 'terisolir',
            'installation_date' => '2025-04-05',
            'latitude' => -8.1685,
            'longitude' => 113.6830,
        ]);

        $c5 = Customer::create([
            'customer_id' => 'CUST-2026-005',
            'package_id' => $pkg3->id,
            'name' => 'CV. Eko Jaya',
            'address' => 'Jl. Gajah Mada No. 101, Jember',
            'phone' => '081234567894',
            'email' => 'finance@ekojaya.co.id',
            'package_name' => $pkg3->name,
            'ip_address' => '10.20.30.105',
            'status' => 'aktif',
            'installation_date' => '2025-04-15',
            'latitude' => -8.1720,
            'longitude' => 113.6750,
        ]);

        $c6 = Customer::create([
            'customer_id' => 'CUST-2026-006',
            'package_id' => $pkg2->id,
            'name' => 'Fajar Hidayat',
            'address' => 'Jl. Sumbersari No. 25, Jember',
            'phone' => '081234567895',
            'email' => 'fajar.hidayat@gmail.com',
            'package_name' => $pkg2->name,
            'ip_address' => '10.20.30.106',
            'status' => 'terisolir',
            'installation_date' => '2025-04-20',
            'latitude' => -8.1750,
            'longitude' => 113.6890,
        ]);

        $c7 = Customer::create([
            'customer_id' => 'CUST-2026-007',
            'package_id' => $pkg1->id,
            'name' => 'Gita Permata',
            'address' => 'Jl. Danau Toba No. 2, Jember',
            'phone' => '081234567896',
            'email' => 'gita.permata@gmail.com',
            'package_name' => $pkg1->name,
            'ip_address' => '10.20.30.107',
            'status' => 'aktif',
            'installation_date' => '2025-04-01',
            'latitude' => -8.1690,
            'longitude' => 113.6860,
        ]);

        // 3. Generate 12-Month Invoice History (June 2025 - May 2026)
        $startMonth = Carbon::now()->subMonths(11)->startOfMonth();
        
        for ($i = 0; $i < 12; $i++) {
            $currentMonthDate = (clone $startMonth)->addMonths($i);
            $month = $currentMonthDate->month;
            $year = $currentMonthDate->year;
            $isThisMonth = ($i === 11);
            $isLastMonth = ($i === 10);
            $isTwoMonthsAgo = ($i === 9);

            // Customer 1: Rian Pratama (Lunas all months)
            Invoice::create([
                'customer_id' => $c1->id,
                'package_id' => $pkg1->id,
                'amount' => $pkg1->price,
                'status' => 'paid',
                'month' => $month,
                'year' => $year,
                'due_date' => Carbon::create($year, $month, 10),
                'xendit_paid_at' => Carbon::create($year, $month, rand(1, 9)),
                'payment_method' => 'Xendit (Virtual Account)',
            ]);

            // Customer 2: Siti Aminah (Lunas except this month)
            if ($isThisMonth) {
                Invoice::create([
                    'customer_id' => $c2->id,
                    'package_id' => $pkg1->id,
                    'amount' => $pkg1->price,
                    'status' => 'unpaid',
                    'month' => $month,
                    'year' => $year,
                    'due_date' => Carbon::now()->addDays(2),
                ]);
            } else {
                Invoice::create([
                    'customer_id' => $c2->id,
                    'package_id' => $pkg1->id,
                    'amount' => $pkg1->price,
                    'status' => 'paid',
                    'month' => $month,
                    'year' => $year,
                    'due_date' => Carbon::create($year, $month, 10),
                    'xendit_paid_at' => Carbon::create($year, $month, rand(1, 9)),
                    'payment_method' => 'Xendit (QRIS)',
                ]);
            }

            // Customer 3: Budi Santoso (Lunas all months)
            Invoice::create([
                'customer_id' => $c3->id,
                'package_id' => $pkg2->id,
                'amount' => $pkg2->price,
                'status' => 'paid',
                'month' => $month,
                'year' => $year,
                'due_date' => Carbon::create($year, $month, 10),
                'xendit_paid_at' => Carbon::create($year, $month, rand(1, 9)),
                'payment_method' => 'Xendit (QRIS)',
            ]);

            // Customer 4: Diana Lestari (Lunas except last 2 months -> Terisolir)
            if ($isThisMonth || $isLastMonth) {
                Invoice::create([
                    'customer_id' => $c4->id,
                    'package_id' => $pkg1->id,
                    'amount' => $pkg1->price,
                    'status' => 'unpaid',
                    'month' => $month,
                    'year' => $year,
                    'due_date' => Carbon::create($year, $month, 10),
                ]);
            } else {
                Invoice::create([
                    'customer_id' => $c4->id,
                    'package_id' => $pkg1->id,
                    'amount' => $pkg1->price,
                    'status' => 'paid',
                    'month' => $month,
                    'year' => $year,
                    'due_date' => Carbon::create($year, $month, 10),
                    'xendit_paid_at' => Carbon::create($year, $month, rand(1, 9)),
                    'payment_method' => 'Xendit (Virtual Account)',
                ]);
            }

            // Customer 5: CV. Eko Jaya (Lunas all months)
            Invoice::create([
                'customer_id' => $c5->id,
                'package_id' => $pkg3->id,
                'amount' => $pkg3->price,
                'status' => 'paid',
                'month' => $month,
                'year' => $year,
                'due_date' => Carbon::create($year, $month, 10),
                'xendit_paid_at' => Carbon::create($year, $month, rand(1, 9)),
                'payment_method' => 'Transfer Bank Manual',
            ]);

            // Customer 6: Fajar Hidayat (Lunas except last 3 months -> Terisolir)
            if ($isThisMonth || $isLastMonth || $isTwoMonthsAgo) {
                Invoice::create([
                    'customer_id' => $c6->id,
                    'package_id' => $pkg2->id,
                    'amount' => $pkg2->price,
                    'status' => 'unpaid',
                    'month' => $month,
                    'year' => $year,
                    'due_date' => Carbon::create($year, $month, 10),
                ]);
            } else {
                Invoice::create([
                    'customer_id' => $c6->id,
                    'package_id' => $pkg2->id,
                    'amount' => $pkg2->price,
                    'status' => 'paid',
                    'month' => $month,
                    'year' => $year,
                    'due_date' => Carbon::create($year, $month, 10),
                    'xendit_paid_at' => Carbon::create($year, $month, rand(1, 9)),
                    'payment_method' => 'Xendit (Virtual Account)',
                ]);
            }

            // Customer 7: Gita Permata (Lunas except this month)
            if ($isThisMonth) {
                Invoice::create([
                    'customer_id' => $c7->id,
                    'package_id' => $pkg1->id,
                    'amount' => $pkg1->price,
                    'status' => 'unpaid',
                    'month' => $month,
                    'year' => $year,
                    'due_date' => Carbon::now()->addDay(),
                ]);
            } else {
                Invoice::create([
                    'customer_id' => $c7->id,
                    'package_id' => $pkg1->id,
                    'amount' => $pkg1->price,
                    'status' => 'paid',
                    'month' => $month,
                    'year' => $year,
                    'due_date' => Carbon::create($year, $month, 10),
                    'xendit_paid_at' => Carbon::create($year, $month, rand(1, 9)),
                    'payment_method' => 'Xendit (Virtual Account)',
                ]);
            }
        }

        // 4. Create Network Topology Nodes
        $nocNode = NetworkNode::create([
            'name' => 'NOC Pusat',
            'type' => 'noc',
            'lat' => -8.1600,
            'lng' => 113.6700,
            'status' => 'aktif',
        ]);

        $odcNode = NetworkNode::create([
            'name' => 'ODC Sumbersari',
            'type' => 'odc',
            'lat' => -8.1650,
            'lng' => 113.6750,
            'status' => 'aktif',
            'parent_id' => $nocNode->id,
        ]);

        $odpNode1 = NetworkNode::create([
            'name' => 'ODP-SBR-01',
            'type' => 'odp',
            'lat' => -8.1670,
            'lng' => 113.6800,
            'status' => 'aktif',
            'parent_id' => $odcNode->id,
            'max_ports' => 8,
        ]);

        $odpNode2 = NetworkNode::create([
            'name' => 'ODP-SBR-02',
            'type' => 'odp',
            'lat' => -8.1700,
            'lng' => 113.6720,
            'status' => 'aktif',
            'parent_id' => $odcNode->id,
            'max_ports' => 8,
        ]);

        // Customer nodes in map
        $custNode1 = NetworkNode::create([
            'name' => 'Rian Pratama',
            'type' => 'customer',
            'lat' => $c1->latitude,
            'lng' => $c1->longitude,
            'status' => 'aktif',
            'customer_id' => $c1->id,
            'parent_id' => $odpNode1->id,
        ]);

        $custNode2 = NetworkNode::create([
            'name' => 'Siti Aminah',
            'type' => 'customer',
            'lat' => $c2->latitude,
            'lng' => $c2->longitude,
            'status' => 'aktif',
            'customer_id' => $c2->id,
            'parent_id' => $odpNode1->id,
        ]);

        $custNode3 = NetworkNode::create([
            'name' => 'Budi Santoso',
            'type' => 'customer',
            'lat' => $c3->latitude,
            'lng' => $c3->longitude,
            'status' => 'aktif',
            'customer_id' => $c3->id,
            'parent_id' => $odpNode1->id,
        ]);

        $custNode4 = NetworkNode::create([
            'name' => 'Diana Lestari',
            'type' => 'customer',
            'lat' => $c4->latitude,
            'lng' => $c4->longitude,
            'status' => 'los',
            'customer_id' => $c4->id,
            'parent_id' => $odpNode1->id,
        ]);

        $custNode5 = NetworkNode::create([
            'name' => 'CV. Eko Jaya',
            'type' => 'customer',
            'lat' => $c5->latitude,
            'lng' => $c5->longitude,
            'status' => 'aktif',
            'customer_id' => $c5->id,
            'parent_id' => $odpNode2->id,
        ]);

        $custNode6 = NetworkNode::create([
            'name' => 'Fajar Hidayat',
            'type' => 'customer',
            'lat' => $c6->latitude,
            'lng' => $c6->longitude,
            'status' => 'los',
            'customer_id' => $c6->id,
            'parent_id' => $odpNode2->id,
        ]);

        $custNode7 = NetworkNode::create([
            'name' => 'Gita Permata',
            'type' => 'customer',
            'lat' => $c7->latitude,
            'lng' => $c7->longitude,
            'status' => 'aktif',
            'customer_id' => $c7->id,
            'parent_id' => $odpNode2->id,
        ]);

        // 5. Create Network Edges (cables connecting elements)
        // Backbone (NOC -> ODC)
        NetworkEdge::create([
            'from_node_id' => $nocNode->id,
            'to_node_id' => $odcNode->id,
            'type' => 'Backbone',
            'cable_color' => '#10b981',
            'label' => 'Backbone FO 24 Core',
        ]);

        // Distribution (ODC -> ODPs)
        NetworkEdge::create([
            'from_node_id' => $odcNode->id,
            'to_node_id' => $odpNode1->id,
            'type' => 'Distribution',
            'cable_color' => '#8b5cf6',
            'label' => 'Distribution FO ODP-1',
        ]);

        NetworkEdge::create([
            'from_node_id' => $odcNode->id,
            'to_node_id' => $odpNode2->id,
            'type' => 'Distribution',
            'cable_color' => '#8b5cf6',
            'label' => 'Distribution FO ODP-2',
        ]);

        // Drop Cables (ODP -> Customer Nodes)
        // ODP-SBR-01
        NetworkEdge::create([
            'from_node_id' => $odpNode1->id,
            'to_node_id' => $custNode1->id,
            'type' => 'Distribution',
            'cable_color' => '#3b82f6',
            'label' => 'Drop Core Rian Pratama',
        ]);

        NetworkEdge::create([
            'from_node_id' => $odpNode1->id,
            'to_node_id' => $custNode2->id,
            'type' => 'Distribution',
            'cable_color' => '#3b82f6',
            'label' => 'Drop Core Siti Aminah',
        ]);

        NetworkEdge::create([
            'from_node_id' => $odpNode1->id,
            'to_node_id' => $custNode3->id,
            'type' => 'Distribution',
            'cable_color' => '#3b82f6',
            'label' => 'Drop Core Budi Santoso',
        ]);

        NetworkEdge::create([
            'from_node_id' => $odpNode1->id,
            'to_node_id' => $custNode4->id,
            'type' => 'Distribution',
            'cable_color' => '#ef4444',
            'label' => 'Drop Core Diana Lestari',
        ]);

        // ODP-SBR-02
        NetworkEdge::create([
            'from_node_id' => $odpNode2->id,
            'to_node_id' => $custNode5->id,
            'type' => 'Distribution',
            'cable_color' => '#3b82f6',
            'label' => 'Drop Core CV. Eko Jaya',
        ]);

        NetworkEdge::create([
            'from_node_id' => $odpNode2->id,
            'to_node_id' => $custNode6->id,
            'type' => 'Distribution',
            'cable_color' => '#ef4444',
            'label' => 'Drop Core Fajar Hidayat',
        ]);

        NetworkEdge::create([
            'from_node_id' => $odpNode2->id,
            'to_node_id' => $custNode7->id,
            'type' => 'Distribution',
            'cable_color' => '#3b82f6',
            'label' => 'Drop Core Gita Permata',
        ]);

        // 6. Add Ticket for isolated client
        Ticket::create([
            'title' => 'Koneksi Terputus (Isolir)',
            'description' => 'Pelanggan bertanya kenapa koneksi internet mati total.',
            'customer_id' => $c4->id,
            'assigned_to' => 2, // Admin
            'status' => 'open',
            'priority' => 'high',
        ]);
    }
}

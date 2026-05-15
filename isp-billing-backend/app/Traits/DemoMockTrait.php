<?php

namespace App\Traits;

use Carbon\Carbon;

trait DemoMockTrait
{
    /**
     * Check if the current authenticated user is a demo user.
     */
    protected function isDemoUser()
    {
        $user = auth()->user();
        if (!$user) return false;
        return str_starts_with($user->username, 'demo_');
    }

    /**
     * Get Mock Dashboard Data
     */
    protected function getMockDashboardData()
    {
        $now = Carbon::now();
        $chartData = [];
        
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $paid = rand(3, 5) * 1000000;
            $unpaid = rand(0, 1) * 500000;
            $chartData[] = [
                'name' => $date->translatedFormat('M Y'),
                'revenue' => $paid,
                'paid' => $paid,
                'unpaid' => $unpaid,
                'total' => $paid + $unpaid
            ];
        }

        return [
            'stats' => [
                'total_customers' => 15,
                'active_customers' => 12,
                'total_packages' => 3,
                'revenue_this_month' => 4500000,
                'pending_payments' => 750000,
            ],
            'chartData' => $chartData,
            'recent_activities' => [
                ['id' => 9991, 'customer' => ['name' => 'Agus Demo'], 'amount' => 350000, 'status' => 'paid', 'created_at' => $now->toIso8601String()],
                ['id' => 9992, 'customer' => ['name' => 'Budi Demo'], 'amount' => 250000, 'status' => 'unpaid', 'created_at' => $now->subHours(2)->toIso8601String()],
                ['id' => 9993, 'customer' => ['name' => 'Citra Demo'], 'amount' => 550000, 'status' => 'paid', 'created_at' => $now->subDay()->toIso8601String()],
                ['id' => 9994, 'customer' => ['name' => 'Dedi Demo'], 'amount' => 350000, 'status' => 'paid', 'created_at' => $now->subDays(2)->toIso8601String()],
            ]
        ];
    }

    /**
     * Get Mock Customers Data
     */
    protected function getMockCustomers()
    {
        $customers = [
            ['id' => 1, 'customer_id' => 'CUST-DEMO-01', 'name' => 'Agus Demo', 'username' => 'agus_demo', 'email' => 'agus@demo.com', 'phone' => '08123456789', 'address' => 'Jl. Demo No. 1, Jakarta', 'status' => 'aktif', 'ip_address' => '10.20.30.101', 'package_name' => 'SOHO 50 Mbps', 'package' => ['name' => 'SOHO 50 Mbps', 'speed' => '50 Mbps', 'price' => 350000], 'created_at' => '2026-01-01T10:00:00Z'],
            ['id' => 2, 'customer_id' => 'CUST-DEMO-02', 'name' => 'Budi Demo', 'username' => 'budi_demo', 'email' => 'budi@demo.com', 'phone' => '08123456780', 'address' => 'Jl. Demo No. 2, Bandung', 'status' => 'terisolir', 'ip_address' => '10.20.30.102', 'package_name' => 'Home 20 Mbps', 'package' => ['name' => 'Home 20 Mbps', 'speed' => '20 Mbps', 'price' => 250000], 'created_at' => '2026-02-15T14:30:00Z'],
            ['id' => 3, 'customer_id' => 'CUST-DEMO-03', 'name' => 'Citra Demo', 'username' => 'citra_demo', 'email' => 'citra@demo.com', 'phone' => '08123456781', 'address' => 'Jl. Demo No. 3, Surabaya', 'status' => 'aktif', 'ip_address' => '10.20.30.103', 'package_name' => 'Business 100 Mbps', 'package' => ['name' => 'Business 100 Mbps', 'speed' => '100 Mbps', 'price' => 550000], 'created_at' => '2026-03-10T09:15:00Z'],
            ['id' => 4, 'customer_id' => 'CUST-DEMO-04', 'name' => 'Dedi Demo', 'username' => 'dedi_demo', 'email' => 'dedi@demo.com', 'phone' => '08123456782', 'address' => 'Jl. Demo No. 4, Malang', 'status' => 'aktif', 'ip_address' => '10.20.30.104', 'package_name' => 'SOHO 50 Mbps', 'package' => ['name' => 'SOHO 50 Mbps', 'speed' => '50 Mbps', 'price' => 350000], 'created_at' => '2026-03-20T11:00:00Z'],
            ['id' => 5, 'customer_id' => 'CUST-DEMO-05', 'name' => 'Eka Demo', 'username' => 'eka_demo', 'email' => 'eka@demo.com', 'phone' => '08123456783', 'address' => 'Jl. Demo No. 5, Yogyakarta', 'status' => 'non-aktif', 'ip_address' => '10.20.30.105', 'package_name' => 'Home 20 Mbps', 'package' => ['name' => 'Home 20 Mbps', 'speed' => '20 Mbps', 'price' => 250000], 'created_at' => '2026-04-01T08:45:00Z'],
            ['id' => 6, 'customer_id' => 'CUST-DEMO-06', 'name' => 'Fani Demo', 'username' => 'fani_demo', 'email' => 'fani@demo.com', 'phone' => '08123456784', 'address' => 'Jl. Demo No. 6, Semarang', 'status' => 'aktif', 'ip_address' => '10.20.30.106', 'package_name' => 'SOHO 50 Mbps', 'package' => ['name' => 'SOHO 50 Mbps', 'speed' => '50 Mbps', 'price' => 350000], 'created_at' => '2026-04-10T15:20:00Z'],
            ['id' => 7, 'customer_id' => 'CUST-DEMO-07', 'name' => 'Gani Demo', 'username' => 'gani_demo', 'email' => 'gani@demo.com', 'phone' => '08123456785', 'address' => 'Jl. Demo No. 7, Solo', 'status' => 'aktif', 'ip_address' => '10.20.30.107', 'package_name' => 'Business 100 Mbps', 'package' => ['name' => 'Business 100 Mbps', 'speed' => '100 Mbps', 'price' => 550000], 'created_at' => '2026-04-15T10:10:00Z'],
            ['id' => 8, 'customer_id' => 'CUST-DEMO-08', 'name' => 'Hani Demo', 'username' => 'hani_demo', 'email' => 'hani@demo.com', 'phone' => '08123456786', 'address' => 'Jl. Demo No. 8, Bogor', 'status' => 'terisolir', 'ip_address' => '10.20.30.108', 'package_name' => 'Home 20 Mbps', 'package' => ['name' => 'Home 20 Mbps', 'speed' => '20 Mbps', 'price' => 250000], 'created_at' => '2026-04-20T13:00:00Z'],
            ['id' => 9, 'customer_id' => 'CUST-DEMO-09', 'name' => 'Indra Demo', 'username' => 'indra_demo', 'email' => 'indra@demo.com', 'phone' => '08123456787', 'address' => 'Jl. Demo No. 9, Depok', 'status' => 'aktif', 'ip_address' => '10.20.30.109', 'package_name' => 'SOHO 50 Mbps', 'package' => ['name' => 'SOHO 50 Mbps', 'speed' => '50 Mbps', 'price' => 350000], 'created_at' => '2026-04-25T09:30:00Z'],
            ['id' => 10, 'customer_id' => 'CUST-DEMO-10', 'name' => 'Joni Demo', 'username' => 'joni_demo', 'email' => 'joni@demo.com', 'phone' => '08123456788', 'address' => 'Jl. Demo No. 10, Tangerang', 'status' => 'aktif', 'ip_address' => '10.20.30.110', 'package_name' => 'Business 100 Mbps', 'package' => ['name' => 'Business 100 Mbps', 'speed' => '100 Mbps', 'price' => 550000], 'created_at' => '2026-05-01T14:00:00Z'],
            ['id' => 11, 'customer_id' => 'CUST-DEMO-11', 'name' => 'Kiki Demo', 'username' => 'kiki_demo', 'email' => 'kiki@demo.com', 'phone' => '08123456789', 'address' => 'Jl. Demo No. 11, Bekasi', 'status' => 'aktif', 'ip_address' => '10.20.30.111', 'package_name' => 'Home 20 Mbps', 'package' => ['name' => 'Home 20 Mbps', 'speed' => '20 Mbps', 'price' => 250000], 'created_at' => '2026-05-02T10:00:00Z'],
            ['id' => 12, 'customer_id' => 'CUST-DEMO-12', 'name' => 'Lina Demo', 'username' => 'lina_demo', 'email' => 'lina@demo.com', 'phone' => '08123456790', 'address' => 'Jl. Demo No. 12, Medan', 'status' => 'aktif', 'ip_address' => '10.20.30.112', 'package_name' => 'SOHO 50 Mbps', 'package' => ['name' => 'SOHO 50 Mbps', 'speed' => '50 Mbps', 'price' => 350000], 'created_at' => '2026-05-03T11:00:00Z'],
            ['id' => 13, 'customer_id' => 'CUST-DEMO-13', 'name' => 'Mila Demo', 'username' => 'mila_demo', 'email' => 'mila@demo.com', 'phone' => '08123456791', 'address' => 'Jl. Demo No. 13, Padang', 'status' => 'aktif', 'ip_address' => '10.20.30.113', 'package_name' => 'Business 100 Mbps', 'package' => ['name' => 'Business 100 Mbps', 'speed' => '100 Mbps', 'price' => 550000], 'created_at' => '2026-05-04T12:00:00Z'],
            ['id' => 14, 'customer_id' => 'CUST-DEMO-14', 'name' => 'Nina Demo', 'username' => 'nina_demo', 'email' => 'nina@demo.com', 'phone' => '08123456792', 'address' => 'Jl. Demo No. 14, Bali', 'status' => 'aktif', 'ip_address' => '10.20.30.114', 'package_name' => 'Home 20 Mbps', 'package' => ['name' => 'Home 20 Mbps', 'speed' => '20 Mbps', 'price' => 250000], 'created_at' => '2026-05-05T13:00:00Z'],
            ['id' => 15, 'customer_id' => 'CUST-DEMO-15', 'name' => 'Oki Demo', 'username' => 'oki_demo', 'email' => 'oki@demo.com', 'phone' => '08123456793', 'address' => 'Jl. Demo No. 15, Makassar', 'status' => 'aktif', 'ip_address' => '10.20.30.115', 'package_name' => 'SOHO 50 Mbps', 'package' => ['name' => 'SOHO 50 Mbps', 'speed' => '50 Mbps', 'price' => 350000], 'created_at' => '2026-05-06T14:00:00Z'],
        ];

        return [
            'data' => $customers,
            'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'total' => count($customers)
            ]
        ];
    }

    protected function getMockInvoices()
    {
        $invoices = [];
        $customers = $this->getMockCustomers()['data'];
        
        $idCounter = 101;
        foreach ($customers as $c) {
            $isPaid = $c['status'] === 'aktif';
            
            $invoices[] = [
                'id' => $idCounter++,
                'customer' => ['name' => $c['name']],
                'package' => [
                    'name' => $c['package']['name'], 
                    'speed' => $c['package']['speed']
                ],
                'amount' => $c['package']['price'],
                'status' => $isPaid ? 'paid' : 'unpaid',
                'month' => Carbon::now()->month,
                'year' => Carbon::now()->year,
                'due_date' => Carbon::now()->startOfMonth()->addDays(10)->toDateString(),
                'created_at' => $isPaid 
                    ? Carbon::now()->subDays(rand(1, 15))->toIso8601String() 
                    : Carbon::now()->subDays(rand(20, 30))->toIso8601String()
            ];
        }

        return $invoices;
    }

    protected function getMockNocData()
    {
        // Gabungkan perangkat NOC sistem dan ONT pelanggan
        $systemDevices = [
            ['name' => 'CORE-SW-01 (System)', 'status' => 'online', 'ip' => '10.0.0.1'],
            ['name' => 'OLT-GPON-01 (System)', 'status' => 'online', 'ip' => '10.0.0.5'],
            ['name' => 'DIST-SW-02 (System)', 'status' => 'online', 'ip' => '10.0.0.10'],
        ];

        $customerDevices = [];
        $customersData = $this->getMockCustomers()['data'];
        foreach ($customersData as $c) {
            $customerDevices[] = [
                'name' => 'Modem ' . $c['name'],
                'status' => $c['status'] === 'aktif' ? 'online' : 'offline',
                'ip' => $c['ip_address'],
            ];
        }

        return [
            'success' => true,
            'data' => [
                'cpu_load' => rand(15, 45),
                'uptime' => '45d 12:30:15',
                'logs' => [
                    ['time' => date('H:i:s'), 'topics' => 'pppoe,info', 'message' => 'Agus Demo connected'],
                    ['time' => date('H:i:s', strtotime('-5 mins')), 'topics' => 'system,info', 'message' => 'Backup created'],
                    ['time' => date('H:i:s', strtotime('-1 hour')), 'topics' => 'script,info', 'message' => 'Auto-isolir job finished'],
                ],
                'traffic' => [
                    'isp1' => ['tx' => rand(150, 400), 'rx' => rand(500, 900), 'total' => 1200],
                    'isp2' => ['tx' => rand(50, 150), 'rx' => rand(100, 300), 'total' => 450],
                ],
                'alarms' => [],
                'devices' => array_merge($systemDevices, $customerDevices),
                'ont_devices' => []
            ]
        ];
    }

    /**
     * Get Mock Audit Logs
     */
    protected function getMockAuditLogs()
    {
        $logs = [];
        $actions = ['LOGIN', 'CREATE_CUSTOMER', 'PAYMENT_VERIFIED', 'AUTO_ISOLIR', 'SEND_NOTIFICATION'];
        $details = [
            'LOGIN' => 'Login berhasil (demo_pemilik)',
            'CREATE_CUSTOMER' => 'Menambahkan pelanggan baru: Citra Demo',
            'PAYMENT_VERIFIED' => 'Verifikasi pembayaran tagihan #101 (Agus Demo)',
            'AUTO_ISOLIR' => 'Isolir otomatis pelanggan: Budi Demo (Overdue)',
            'SEND_NOTIFICATION' => 'Kirim tagihan WA ke 08123456789'
        ];

        for ($i = 0; $i < 15; $i++) {
            $action = $actions[array_rand($actions)];
            $logs[] = [
                'id' => 1000 + $i,
                'user_id' => 1,
                'user' => ['id' => 1, 'name' => 'Demo Pemilik', 'role' => 'pemilik'],
                'action' => $action,
                'detail' => $details[$action],
                'ip_address' => '110.12.33.' . rand(1, 254),
                'created_at' => Carbon::now()->subMinutes($i * 15)->toIso8601String()
            ];
        }
        return $logs;
    }

    /**
     * Get Mock Users
     */
    protected function getMockUsers()
    {
        return [
            ['id' => 1, 'name' => 'Demo Pemilik', 'username' => 'demo_pemilik', 'role' => 'pemilik', 'created_at' => '2026-01-01T00:00:00Z'],
            ['id' => 2, 'name' => 'Demo Admin', 'username' => 'demo_admin', 'role' => 'admin', 'created_at' => '2026-01-05T00:00:00Z'],
            ['id' => 3, 'name' => 'Demo Teknisi', 'username' => 'demo_teknisi', 'role' => 'teknisi', 'created_at' => '2026-02-10T00:00:00Z']
        ];
    }

    /**
     * Get Mock Packages
     */
    protected function getMockPackages()
    {
        return [
            ['id' => 1, 'name' => 'Home 20 Mbps', 'speed' => '20 Mbps', 'download' => 20, 'upload' => 10, 'profile' => 'Profile-20M', 'price' => 250000, 'status' => 'Aktif'],
            ['id' => 2, 'name' => 'SOHO 50 Mbps', 'speed' => '50 Mbps', 'download' => 50, 'upload' => 25, 'profile' => 'Profile-50M', 'price' => 350000, 'status' => 'Aktif'],
            ['id' => 3, 'name' => 'Business 100 Mbps', 'speed' => '100 Mbps', 'download' => 100, 'upload' => 100, 'profile' => 'Profile-100M', 'price' => 550000, 'status' => 'Aktif']
        ];
    }

    /**
     * Get Mock Settings
     */
    protected function getMockSettings()
    {
        return [
            'apiIp' => '10.20.30.1',
            'apiPort' => '8728',
            'apiUser' => 'demo_admin',
            'apiPass' => '********',
            'dbHost' => '10.20.30.2',
            'dbName' => 'radius_demo',
            'dbUser' => 'radius_user',
            'dbPass' => '********',
            'waToken' => 'DEMO_WA_TOKEN_123456789',
            'waNumber' => '081234567890'
        ];
    }

    /**
     * Get Mock Map Live Data
     */
    public function getMockMapLiveData()
    {
        $customers = $this->getMockCustomers()['data'];
        $customerStatuses = [];
        $sessions = [];
        $activeTickets = [];
        
        foreach ($customers as $c) {
            $isIsolir = in_array($c['status'], ['terisolir', 'nonaktif']);
            $customerStatuses[$c['id']] = ['is_isolir' => $isIsolir];
            
            // Generate ticket for Customer ID 3 to show Ticket icon
            if ($c['id'] == 3) {
                $activeTickets[$c['id']] = ['priority' => 'high', 'category' => 'LOS', 'status' => 'open'];
            }
            
            // Generate Radius session if not isolir, except for customer 4 to show offline scenario
            if (!$isIsolir && $c['id'] != 4) {
                $sessions[] = [
                    'username' => $c['name'],
                    'ip_address' => '10.20.' . rand(1,5) . '.' . rand(2,254),
                    'download_mb' => $c['id'] == 1 ? 1500 : rand(10, 300), // ID 1 Heavy User
                    'upload_mb' => $c['id'] == 1 ? 300 : rand(1, 50),
                    'is_online' => true,
                    'is_heavy' => $c['id'] == 1
                ];
            }
        }

        // ODC 3 (Patrang) is offline. So ODP 2 (node 6) and Customers 6..10 (nodes 13..17) are affected.
        return [
            'success' => true,
            'noc_health' => [
                '1' => ['status' => 'online', 'latency' => 8, 'cpu_load' => 24, 'uptime' => '45d 12h'], // SERVER
                '2' => ['status' => 'warning', 'latency' => 125, 'cpu_load' => 85, 'uptime' => '12d 04h'], // ODC Sukorambi (Warning)
                '3' => ['status' => 'offline', 'latency' => null, 'cpu_load' => null, 'uptime' => null], // ODC Patrang (Offline)
                '4' => ['status' => 'online', 'latency' => 12, 'cpu_load' => 15, 'uptime' => '25d 10h'], // ODC Mangli (Online)
            ],
            'customer_statuses' => $customerStatuses,
            'radius_sessions' => ['sessions' => $sessions],
            'active_tickets' => $activeTickets,
            'odp_capacity' => [
                '5' => ['used' => 5, 'max' => 8, 'percent' => 62, 'is_full' => false],
                '6' => ['used' => 5, 'max' => 8, 'percent' => 62, 'is_full' => false],
                '7' => ['used' => 5, 'max' => 16, 'percent' => 31, 'is_full' => false],
            ],
            'blast_radius' => [
                'offline_parents' => [3],
                'affected_nodes' => [6, 13, 14, 15, 16, 17], // ODP 2 and Customers 6 to 10
            ]
        ];
    }

    /**
     * Get Mock Network Topology
     */
    public function getMockNetworkTopology()
    {
        $nodes = [
            ['id' => 1, 'name' => 'SERVER Jember', 'type' => 'server', 'lat' => -8.170, 'lng' => 113.700, 'parent_id' => null],
            ['id' => 2, 'name' => 'ODC Sukorambi', 'type' => 'odc', 'lat' => -8.165, 'lng' => 113.680, 'parent_id' => 1],
            ['id' => 3, 'name' => 'ODC Patrang', 'type' => 'odc', 'lat' => -8.150, 'lng' => 113.710, 'parent_id' => 1],
            ['id' => 4, 'name' => 'ODC Mangli', 'type' => 'odc', 'lat' => -8.180, 'lng' => 113.670, 'parent_id' => 1],
            ['id' => 5, 'name' => 'ODP 1 Sukorambi', 'type' => 'odp', 'lat' => -8.166, 'lng' => 113.681, 'parent_id' => 2, 'max_ports' => 8],
            ['id' => 6, 'name' => 'ODP 2 Patrang', 'type' => 'odp', 'lat' => -8.151, 'lng' => 113.712, 'parent_id' => 3, 'max_ports' => 8],
            ['id' => 7, 'name' => 'ODP 3 Mangli', 'type' => 'odp', 'lat' => -8.182, 'lng' => 113.672, 'parent_id' => 4, 'max_ports' => 16],
        ];

        $edges = [
            ['id' => 1, 'from_node_id' => 1, 'to_node_id' => 2, 'type' => 'Backbone', 'cable_color' => '#1d4ed8'],
            ['id' => 2, 'from_node_id' => 1, 'to_node_id' => 3, 'type' => 'Backbone', 'cable_color' => '#1d4ed8'],
            ['id' => 3, 'from_node_id' => 1, 'to_node_id' => 4, 'type' => 'Backbone', 'cable_color' => '#1d4ed8'],
            ['id' => 4, 'from_node_id' => 2, 'to_node_id' => 5, 'type' => 'Distribution', 'cable_color' => '#059669'],
            ['id' => 5, 'from_node_id' => 3, 'to_node_id' => 6, 'type' => 'Distribution', 'cable_color' => '#059669'],
            ['id' => 6, 'from_node_id' => 4, 'to_node_id' => 7, 'type' => 'Distribution', 'cable_color' => '#059669'],
        ];

        $customers = $this->getMockCustomers()['data'];
        $nodeId = 8;
        $edgeId = 7;

        foreach ($customers as $idx => $c) {
            if ($idx < 5) {
                $parentId = 5; // Sukorambi
                $lat = -8.166 + (rand(-5, 5) / 1000);
                $lng = 113.681 + (rand(-5, 5) / 1000);
            } elseif ($idx < 10) {
                $parentId = 6; // Patrang
                $lat = -8.151 + (rand(-5, 5) / 1000);
                $lng = 113.712 + (rand(-5, 5) / 1000);
            } else {
                $parentId = 7; // Mangli
                $lat = -8.182 + (rand(-5, 5) / 1000);
                $lng = 113.672 + (rand(-5, 5) / 1000);
            }

            $nodes[] = [
                'id' => $nodeId,
                'name' => $c['name'],
                'type' => 'customer',
                'lat' => $lat,
                'lng' => $lng,
                'parent_id' => $parentId,
                'customer_id' => $c['id'],
                'customer' => [
                    'id' => $c['id'],
                    'name' => $c['name'],
                    'package_name' => $c['package']['name'],
                    'status' => $c['status']
                ]
            ];

            $edges[] = [
                'id' => $edgeId++,
                'from_node_id' => $parentId,
                'to_node_id' => $nodeId,
                'type' => 'Drop',
                'cable_color' => '#4b5563'
            ];
            $nodeId++;
        }

        return ['nodes' => $nodes, 'edges' => $edges];
    }

    /**
     * Get Mock Financial Report Data
     */
    protected function getMockFinancialReport()
    {
        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $paid = rand(3, 5) * 1000000;
            $unpaid = rand(0, 1) * 500000;
            $months[] = [
                'label'   => $date->translatedFormat('M Y'),
                'month'   => $date->month,
                'year'    => $date->year,
                'paid'    => $paid,
                'unpaid'  => $unpaid,
                'total'   => $paid + $unpaid,
            ];
        }

        return [
            'months' => $months,
            'summary' => [
                'total_paid'    => 48000000,
                'total_unpaid'  => 3000000,
                'total_invoice' => 180,
                'paid_count'    => 170,
                'unpaid_count'  => 10,
            ],
            'top_customers' => [
                ['name' => 'Citra Demo', 'total_paid' => 6600000],
                ['name' => 'Gani Demo', 'total_paid' => 6600000],
                ['name' => 'Joni Demo', 'total_paid' => 6600000],
                ['name' => 'Mila Demo', 'total_paid' => 6600000],
                ['name' => 'Agus Demo', 'total_paid' => 4200000],
            ],
        ];
    }
}

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
        
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $chartData[] = [
                'name' => $date->translatedFormat('M'),
                'revenue' => rand(15000000, 25000000)
            ];
        }

        return [
            'stats' => [
                'total_customers' => 1250,
                'active_customers' => 1180,
                'total_packages' => 12,
                'revenue_this_month' => 24500000,
                'pending_payments' => 1200000,
            ],
            'chartData' => $chartData,
            'recent_activities' => [
                [
                    'id' => 9991,
                    'customer' => ['name' => 'Demo User Alpha'],
                    'amount' => 150000,
                    'status' => 'paid',
                    'created_at' => $now->toIso8601String()
                ],
                [
                    'id' => 9992,
                    'customer' => ['name' => 'Demo User Beta'],
                    'amount' => 250000,
                    'status' => 'unpaid',
                    'created_at' => $now->subHours(2)->toIso8601String()
                ],
                [
                    'id' => 9993,
                    'customer' => ['name' => 'Demo User Gamma'],
                    'amount' => 150000,
                    'status' => 'paid',
                    'created_at' => $now->subDay()->toIso8601String()
                ]
            ]
        ];
    }

    /**
     * Get Mock Customers Data
     */
    protected function getMockCustomers()
    {
        return [
            'data' => [
                [
                    'id' => 1,
                    'customer_id' => 'CUST-DEMO-01',
                    'name' => 'Agus Demo',
                    'username' => 'agus_demo',
                    'email' => 'agus@demo.com',
                    'phone' => '08123456789',
                    'address' => 'Jl. Demo No. 1, Jakarta',
                    'status' => 'aktif',
                    'package' => ['name' => 'SOHO 50 Mbps', 'speed' => '50 Mbps'],
                    'created_at' => '2026-01-01T10:00:00Z'
                ],
                [
                    'id' => 2,
                    'customer_id' => 'CUST-DEMO-02',
                    'name' => 'Budi Demo',
                    'username' => 'budi_demo',
                    'email' => 'budi@demo.com',
                    'phone' => '08123456780',
                    'address' => 'Jl. Demo No. 2, Bandung',
                    'status' => 'isolated',
                    'package' => ['name' => 'Home 20 Mbps', 'speed' => '20 Mbps'],
                    'created_at' => '2026-02-15T14:30:00Z'
                ],
                [
                    'id' => 3,
                    'customer_id' => 'CUST-DEMO-03',
                    'name' => 'Citra Demo',
                    'username' => 'citra_demo',
                    'email' => 'citra@demo.com',
                    'phone' => '08123456781',
                    'address' => 'Jl. Demo No. 3, Surabaya',
                    'status' => 'aktif',
                    'package' => ['name' => 'Business 100 Mbps', 'speed' => '100 Mbps'],
                    'created_at' => '2026-03-10T09:15:00Z'
                ]
            ],
            'meta' => [
                'current_page' => 1,
                'last_page' => 1,
                'total' => 3
            ]
        ];
    }

    /**
     * Get Mock Invoices Data
     */
    protected function getMockInvoices()
    {
        return [
            [
                'id' => 101,
                'customer' => ['name' => 'Agus Demo'],
                'package' => ['name' => 'SOHO 50 Mbps', 'speed' => '50 Mbps'],
                'amount' => 550000,
                'status' => 'paid',
                'month' => Carbon::now()->month,
                'year' => Carbon::now()->year,
                'due_date' => Carbon::now()->startOfMonth()->addDays(10)->toDateString(),
                'created_at' => Carbon::now()->toIso8601String()
            ],
            [
                'id' => 102,
                'customer' => ['name' => 'Budi Demo'],
                'package' => ['name' => 'Home 20 Mbps', 'speed' => '20 Mbps'],
                'amount' => 250000,
                'status' => 'unpaid',
                'month' => Carbon::now()->month,
                'year' => Carbon::now()->year,
                'due_date' => Carbon::now()->startOfMonth()->addDays(10)->toDateString(),
                'created_at' => Carbon::now()->subDays(2)->toIso8601String()
            ]
        ];
    }

    /**
     * Get Mock NOC Data
     */
    protected function getMockNocData()
    {
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
                'devices' => [
                    ['name' => 'CORE-SW-01', 'status' => 'online', 'ip' => '10.0.0.1'],
                    ['name' => 'OLT-GPON-01', 'status' => 'online', 'ip' => '10.0.0.5'],
                ],
                'ont_devices' => []
            ]
        ];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Package;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

use App\Traits\DemoMockTrait;

class DashboardController extends Controller
{
    use DemoMockTrait;

    public function index()
    {
        if ($this->isDemoUser()) {
            return response()->json($this->getMockDashboardData());
        }
        $data = Cache::remember('dashboard_stats', 900, function () {
            $now = Carbon::now();

            // 1. Ringkasan Statistik
            $stats = [
                'total_customers' => Customer::count(),
                'active_customers' => Customer::where('status', 'aktif')->count(),
                'total_packages' => Package::count(),
                'revenue_this_month' => (float) Invoice::where('status', 'paid')
                    ->where('month', $now->month)
                    ->where('year', $now->year)
                    ->sum('amount'),
                'pending_payments' => (float) Invoice::where('status', 'unpaid')
                    ->where('month', $now->month)
                    ->where('year', $now->year)
                    ->sum('amount'),
            ];

            // 2. Data Grafik (6 Bulan Terakhir)
            $chartData = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $month = $date->month;
                $year = $date->year;
                $monthName = $date->translatedFormat('F');

                $revenue = (float) Invoice::where('status', 'paid')
                    ->where('month', $month)
                    ->where('year', $year)
                    ->sum('amount');

                $chartData[] = [
                    'name' => $monthName,
                    'revenue' => $revenue
                ];
            }

            // 3. Aktivitas Terbaru (Tagihan Terbaru)
            $recent_activities = Invoice::with('customer')
                ->latest()
                ->take(5)
                ->get();

            return [
                'stats' => $stats,
                'chartData' => $chartData,
                'recent_activities' => $recent_activities
            ];
        });

        return response()->json($data);
    }
}

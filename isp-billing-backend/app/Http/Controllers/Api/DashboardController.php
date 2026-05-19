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



class DashboardController extends Controller
{


    public function index()
    {

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

            // 2. Data Grafik (12 Bulan Terakhir)
            $chartData = [];
            for ($i = 11; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $month = $date->month;
                $year = $date->year;
                $monthName = $date->translatedFormat('F');

                $paid = (float) Invoice::where('status', 'paid')
                    ->where('month', $month)
                    ->where('year', $year)
                    ->sum('amount');

                $unpaid = (float) Invoice::where('status', 'unpaid')
                    ->where('month', $month)
                    ->where('year', $year)
                    ->sum('amount');

                $chartData[] = [
                    'name' => $monthName,
                    'paid' => $paid,
                    'unpaid' => $unpaid,
                    'revenue' => $paid,
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

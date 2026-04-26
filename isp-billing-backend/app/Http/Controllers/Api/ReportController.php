<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        // Laporan 12 bulan terakhir
        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $month = $date->month;
            $year  = $date->year;

            $paid   = (float) Invoice::where('status', 'paid')
                ->where('month', $month)->where('year', $year)->sum('amount');
            $unpaid = (float) Invoice::where('status', 'unpaid')
                ->where('month', $month)->where('year', $year)->sum('amount');

            $months[] = [
                'label'   => $date->translatedFormat('M Y'),
                'month'   => $month,
                'year'    => $year,
                'paid'    => $paid,
                'unpaid'  => $unpaid,
                'total'   => $paid + $unpaid,
            ];
        }

        // Summary total
        $summary = [
            'total_paid'    => (float) Invoice::where('status', 'paid')->sum('amount'),
            'total_unpaid'  => (float) Invoice::where('status', 'unpaid')->sum('amount'),
            'total_invoice' => Invoice::count(),
            'paid_count'    => Invoice::where('status', 'paid')->count(),
            'unpaid_count'  => Invoice::where('status', 'unpaid')->count(),
        ];

        // Top 5 pelanggan berdasarkan total bayar
        $topCustomers = Invoice::with('customer:id,name')
            ->where('status', 'paid')
            ->selectRaw('customer_id, SUM(amount) as total_paid')
            ->groupBy('customer_id')
            ->orderByDesc('total_paid')
            ->limit(5)
            ->get()
            ->map(fn($inv) => [
                'name'       => $inv->customer?->name ?? 'N/A',
                'total_paid' => (float) $inv->total_paid,
            ]);

        return response()->json([
            'months'       => $months,
            'summary'      => $summary,
            'top_customers'=> $topCustomers,
        ]);
    }
}

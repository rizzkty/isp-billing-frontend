<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use App\Traits\DemoMockTrait;

class IsolirController extends Controller
{
    use DemoMockTrait;

    /**
     * Jalankan auto-isolir secara manual via API (trigger dari Dashboard Frontend)
     */
    public function runAutoIsolir(Request $request)
    {
        if ($this->isDemoUser()) {
            return response()->json([
                'success' => true,
                'message' => 'Mode Demo: Simulasi auto-isolir selesai.',
                'log' => "Searching overdue invoices...\nFound 2 overdue invoices.\nIsolating Customer: Budi Demo (10.20.30.102)\nIsolating Customer: Hani Demo (10.20.30.108)\nDone."
            ], 200);
        }
        try {
            // Dispatch Job ke Background
            \App\Jobs\RunAutoIsolirJob::dispatch();

            return response()->json([
                'success' => true,
                'message' => 'Proses auto-isolir telah dimulai di background.',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menjalankan auto-isolir: ' . $e->getMessage()
            ], 500);
        }
    }
}

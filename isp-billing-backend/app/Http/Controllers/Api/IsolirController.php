<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class IsolirController extends Controller
{
    /**
     * Jalankan auto-isolir secara manual via API (trigger dari Dashboard Frontend)
     */
    public function runAutoIsolir(Request $request)
    {
        try {
            // Panggil artisan command isp:isolir
            Artisan::call('isp:isolir', ['--manual' => true]);
            $output = Artisan::output();

            return response()->json([
                'success' => true,
                'message' => 'Proses auto-isolir selesai dijalankan.',
                'log'     => $output
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menjalankan auto-isolir: ' . $e->getMessage()
            ], 500);
        }
    }
}

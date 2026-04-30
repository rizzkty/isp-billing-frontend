<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use RouterOS\Client;
use RouterOS\Query;

class NocController extends Controller
{
    public function getDashboardStats(Request $request)
    {
        /* 
          Catatan: Untuk tahap produksi, kredensial MikroTik (IP, User, Pass) 
          seharusnya diambil dari Database aplikasi Anda, bukan dari Request.
          Namun untuk tahap testing ini, kita tangkap dari request UI.
        */
        $request->validate([
            'apiIp' => 'required',
            'apiUser' => 'required',
            'apiPort' => 'required',
        ]);

        try {
            $client = new Client([
                'host' => $request->apiIp,
                'user' => $request->apiUser,
                'pass' => $request->apiPass ?? '',
                'port' => (int) $request->apiPort,
                'timeout' => 3 // Timeout dipercepat agar UI tidak lag saat polling
            ]);

            // 1. Menarik data CPU Load dan Uptime
            $queryResource = new Query('/system/resource/print');
            $resource = $client->query($queryResource)->read();

            // 2. Menarik 10 Log Sistem terakhir (Live Syslog)
            $queryLog = new Query('/log/print');
            $logs = $client->query($queryLog)->read();
            
            // Mengambil 10 baris terbawah (log terbaru) dan membalik urutannya
            $recentLogs = array_reverse(array_slice($logs, -10));

            return response()->json([
                'success' => true,
                'data' => [
                    'status'   => 'ONLINE',
                    'uptime'   => $resource[0]['uptime'] ?? '0s',
                    'cpu_load' => $resource[0]['cpu-load'] ?? 0,
                    'logs'     => $recentLogs
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data NOC: ' . $e->getMessage()
            ], 500);
        }
    }
}
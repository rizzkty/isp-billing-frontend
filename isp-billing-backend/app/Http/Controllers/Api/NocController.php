<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use RouterOS\Client;
use RouterOS\Query;

class NocController extends Controller
{
    // Fungsi bantuan untuk konek ke MikroTik
    private function connectMikrotik()
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        return new Client([
            'host' => $settings['apiIp'] ?? '192.168.1.1',
            'user' => $settings['apiUser'] ?? 'admin',
            'pass' => $settings['apiPass'] ?? '',
            'port' => (int)($settings['apiPort'] ?? 8728),
        ]);
    }

    // 1. FUNGSI STATS (Menarik CPU, Uptime, dan Log Asli MikroTik)
    public function getStats()
    {
        try {
            $client = $this->connectMikrotik();

            // Ambil System Resource (CPU & Uptime)
            $resource = $client->query(new Query('/system/resource/print'))->read();
            $cpuLoad = $resource[0]['cpu-load'] ?? 0;
            $uptime = $resource[0]['uptime'] ?? '0s';

            // Ambil 10 Log terbaru dari MikroTik
            $logQuery = (new Query('/log/print'))->equal('.proplist', 'time,topics,message');
            $logsData = $client->query($logQuery)->read();
            $recentLogs = array_slice($logsData, -10); // Ambil 10 baris terakhir

            $formattedLogs = [];
            foreach ($recentLogs as $log) {
                $formattedLogs[] = [
                    'time' => $log['time'] ?? '--:--',
                    'topics' => $log['topics'] ?? 'system',
                    'message' => $log['message'] ?? ''
                ];
            }

            return response()->json([
                'success' => true,
                'is_demo' => false,
                'data' => [
                    'cpu_load' => $cpuLoad,
                    'uptime' => $uptime,
                    'logs' => $formattedLogs,
                    'alarms' => [],      // Kosongkan dulu untuk tahap ini
                    'devices' => [],     // Kosongkan dulu
                    'ont_devices' => []  // Kosongkan dulu
                ]
            ]);

        } catch (\Exception $e) {
            // Jika MikroTik mati, jangan crash, tapi kirim pesan error ke Terminal UI
            return response()->json([
                'success' => false,
                'is_demo' => true,
                'data' => [
                    'cpu_load' => 0,
                    'uptime' => 'Offline',
                    'logs' => [
                        ['time' => date('H:i:s'), 'topics' => 'error', 'message' => 'Koneksi ke MikroTik Terputus: ' . $e->getMessage()]
                    ],
                    'alarms' => [],
                    'devices' => [],
                    'ont_devices' => []
                ]
            ], 200); 
        }
    }

    // 2. FUNGSI TRAFFIC (Pisah ISP 1 dan ISP 2)
    public function getTraffic()
    {
        try {
            $client = $this->connectMikrotik();

            $query = (new Query('/interface/monitor-traffic'))
                ->equal('interface', 'ether4-INET,ether7-Tsel')
                ->equal('once', '');
            
            $response = $client->query($query)->read();

            $data = [
                'isp1' => ['tx' => 0, 'rx' => 0, 'total' => 0],
                'isp2' => ['tx' => 0, 'rx' => 0, 'total' => 0]
            ];

            foreach ($response as $interface) {
                if ($interface['name'] === 'ether4-INET') {
                    $data['isp1']['tx'] = round((int)$interface['tx-bits-per-second'] / 1000000, 2);
                    $data['isp1']['rx'] = round((int)$interface['rx-bits-per-second'] / 1000000, 2);
                    $data['isp1']['total'] = $data['isp1']['tx'] + $data['isp1']['rx'];
                } elseif ($interface['name'] === 'ether7-Tsel') {
                    $data['isp2']['tx'] = round((int)$interface['tx-bits-per-second'] / 1000000, 2);
                    $data['isp2']['rx'] = round((int)$interface['rx-bits-per-second'] / 1000000, 2);
                    $data['isp2']['total'] = $data['isp2']['tx'] + $data['isp2']['rx'];
                }
            }

            return response()->json(['success' => true, 'data' => $data]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use RouterOS\Client;
use RouterOS\Query;

class NocController extends Controller
{
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

    public function getLiveMonitor()
    {
        try {
            $client = $this->connectMikrotik();

            // 1. Ambil CPU & Uptime
            $resource = $client->query(new Query('/system/resource/print'))->read();
            $cpuLoad = $resource[0]['cpu-load'] ?? 0;
            $uptime = $resource[0]['uptime'] ?? '0s';

            // 2. Ambil 10 Log Terbaru
            $logQuery = (new Query('/log/print'))->equal('.proplist', 'time,topics,message');
            $logs = $client->query($logQuery)->read();
            $recentLogs = array_slice($logs, -10);
            $formattedLogs = [];
            foreach ($recentLogs as $log) {
                $formattedLogs[] = ['time' => $log['time'] ?? '--:--', 'topics' => $log['topics'] ?? 'system', 'message' => $log['message'] ?? ''];
            }

            // 3. Ambil Traffic (Kita pisah query-nya agar MikroTik tidak bingung)
            $trafficData = ['isp1' => ['tx' => 0, 'rx' => 0, 'total' => 0], 'isp2' => ['tx' => 0, 'rx' => 0, 'total' => 0]];

            // =========================================================
            // UBAH NAMA INTERFACE DI BAWAH INI SESUAI MIKROTIK ANDA!
            $namaIsp1 = 'ether4-INET'; 
            $namaIsp2 = 'ether7-Tsel'; 
            // =========================================================

            // Eksekusi ISP 1
            $res1 = $client->query((new Query('/interface/monitor-traffic'))->equal('interface', $namaIsp1)->equal('once', ''))->read();
            if (!empty($res1[0])) {
                $trafficData['isp1']['tx'] = round((int)($res1[0]['tx-bits-per-second'] ?? 0) / 1000000, 2);
                $trafficData['isp1']['rx'] = round((int)($res1[0]['rx-bits-per-second'] ?? 0) / 1000000, 2);
                $trafficData['isp1']['total'] = $trafficData['isp1']['tx'] + $trafficData['isp1']['rx'];
            }

            // Eksekusi ISP 2
            $res2 = $client->query((new Query('/interface/monitor-traffic'))->equal('interface', $namaIsp2)->equal('once', ''))->read();
            if (!empty($res2[0])) {
                $trafficData['isp2']['tx'] = round((int)($res2[0]['tx-bits-per-second'] ?? 0) / 1000000, 2);
                $trafficData['isp2']['rx'] = round((int)($res2[0]['rx-bits-per-second'] ?? 0) / 1000000, 2);
                $trafficData['isp2']['total'] = $trafficData['isp2']['tx'] + $trafficData['isp2']['rx'];
            }

            // Kirim balasan ke React
            return response()->json([
                'success' => true,
                'data' => [
                    'cpu_load' => $cpuLoad,
                    'uptime' => $uptime,
                    'logs' => $formattedLogs,
                    'traffic' => $trafficData,
                    'alarms' => [],
                    'devices' => [],
                    'ont_devices' => []
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
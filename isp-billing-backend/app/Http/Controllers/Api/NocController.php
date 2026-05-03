<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use RouterOS\Client;
use RouterOS\Query;

class NocController extends Controller
{
    // Data dummy untuk Demo Mode
    private function getDemoData(): array
    {
        return [
            'is_demo'   => true,
            'success'   => true,
            'data'      => [
                'status'    => 'DEMO',
                'uptime'    => '12d 4h 37m 10s',
                'cpu_load'  => 23,
                'traffic'   => 412, // Mbps
                'logs'      => [
                    ['time' => '17:30:01', 'topics' => 'system',   'message' => '[DEMO] Router berhasil terkoneksi ke internet.'],
                    ['time' => '17:28:44', 'topics' => 'firewall', 'message' => '[DEMO] Rule NAT Masquerade aktif pada ether1.'],
                    ['time' => '17:25:10', 'topics' => 'dhcp',     'message' => '[DEMO] DHCP lease diberikan ke 192.168.1.55.'],
                    ['time' => '17:20:05', 'topics' => 'wireless', 'message' => '[DEMO] Client baru terhubung ke AP Sektor-2.'],
                    ['time' => '17:15:33', 'topics' => 'system',   'message' => '[DEMO] Backup konfigurasi otomatis berhasil.'],
                ]
            ]
        ];
    }

    public function getDashboardStats()
    {
        // Ambil credentials dari tabel settings (bukan dari request frontend)
        $settings = Setting::whereIn('key', ['apiIp', 'apiPort', 'apiUser', 'apiPass'])
                           ->pluck('value', 'key');

        $apiIp   = $settings->get('apiIp');
        $apiPort = $settings->get('apiPort', '8728');
        $apiUser = $settings->get('apiUser');
        $apiPass = $settings->get('apiPass', '');

        // Jika credentials belum dikonfigurasi, langsung fallback ke Demo Mode
        if (empty($apiIp) || empty($apiUser)) {
            return response()->json($this->getDemoData(), 200);
        }

        try {
            $client = new Client([
                'host'    => $apiIp,
                'user'    => $apiUser,
                'pass'    => $apiPass,
                'port'    => (int) $apiPort,
                'timeout' => 3
            ]);

            // 1. Menarik data CPU Load, Uptime, dan Traffic interface WAN
            $queryResource = new Query('/system/resource/print');
            $resource = $client->query($queryResource)->read();

            // 2. Menarik 10 Log Sistem terakhir (Live Syslog)
            $queryLog = new Query('/log/print');
            $logs = $client->query($queryLog)->read();
            $recentLogs = array_reverse(array_slice($logs, -10));

            // 3. Menarik data traffic interface utama (jika ada)
            $traffic = 0;
            try {
                $queryTraffic = (new Query('/interface/monitor-traffic'))
                    ->equal('interface', 'ether1')
                    ->equal('once', '');
                $trafficData = $client->query($queryTraffic)->read();
                // Konversi dari bps ke Mbps
                $rxBps = $trafficData[0]['rx-bits-per-second'] ?? 0;
                $txBps = $trafficData[0]['tx-bits-per-second'] ?? 0;
                $traffic = round(($rxBps + $txBps) / 1_000_000);
            } catch (\Exception $e) {
                // Interface tidak ditemukan, biarkan traffic = 0
            }

            return response()->json([
                'is_demo' => false,
                'success' => true,
                'data'    => [
                    'status'    => 'ONLINE',
                    'uptime'    => $resource[0]['uptime'] ?? '0s',
                    'cpu_load'  => (int) ($resource[0]['cpu-load'] ?? 0),
                    'traffic'   => $traffic,
                    'logs'      => $recentLogs
                ]
            ], 200);

        } catch (\Exception $e) {
            // Jika koneksi gagal (wrong IP, wrong pass, timeout), fallback ke Demo Mode
            $demo = $this->getDemoData();
            $demo['data']['logs'][] = [
                'time'    => now()->format('H:i:s'),
                'topics'  => 'error',
                'message' => '[DEMO] Gagal ke MikroTik: ' . $e->getMessage()
            ];
            return response()->json($demo, 200);
        }
    }
}
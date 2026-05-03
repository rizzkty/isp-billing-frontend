<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use RouterOS\Client;
use RouterOS\Query;

class NocController extends Controller
{
    // ─── DEMO DATA ────────────────────────────────────────────────────────────
    private function getDemoData(): array
    {
        return [
            'is_demo' => true,
            'success' => true,
            'data'    => [
                'status'    => 'DEMO',
                'uptime'    => '12d 4h 37m 10s',
                'cpu_load'  => 23,
                'traffic'   => 412,
                'logs'      => [
                    ['time' => '17:30:01', 'topics' => 'system',   'message' => '[DEMO] Router berhasil terkoneksi ke internet.'],
                    ['time' => '17:28:44', 'topics' => 'firewall', 'message' => '[DEMO] Rule NAT Masquerade aktif pada ether1.'],
                    ['time' => '17:25:10', 'topics' => 'dhcp',     'message' => '[DEMO] DHCP lease diberikan ke 192.168.1.55.'],
                    ['time' => '17:20:05', 'topics' => 'wireless', 'message' => '[DEMO] Client baru terhubung ke AP Sektor-2.'],
                    ['time' => '17:15:33', 'topics' => 'system',   'message' => '[DEMO] Backup konfigurasi otomatis berhasil.'],
                ],
                // Alarm demo statis
                'alarms'    => [
                    [
                        'type'     => 'los',
                        'severity' => 'critical',
                        'title'    => 'CRITICAL: LOS (Loss of Signal) Terdeteksi',
                        'detail'   => '[DEMO] OLT Port PON 2: Redaman sangat buruk terpantau di ODP area Jl. Sumatera (Pelanggan: Siti Aminah). Rx Power: -32.1 dBm.',
                        'time'     => '17:28:44',
                    ],
                ],
            ]
        ];
    }

    // ─── SMART ALARM DETECTOR ────────────────────────────────────────────────
    /**
     * Scan log baris-per-baris, deteksi pola gangguan, dan kembalikan array alarm.
     */
    private function detectAlarms(array $logs): array
    {
        $alarms = [];

        // Keyword map: [keyword] => [type, severity, title_template]
        $patterns = [
            'loss of signal'   => ['los',        'critical', 'Loss of Signal (LOS) Terdeteksi'],
            'los detected'     => ['los',        'critical', 'Loss of Signal (LOS) Terdeteksi'],
            'link down'        => ['link_down',  'critical', 'Link Down Terdeteksi'],
            'interface down'   => ['link_down',  'critical', 'Interface Down Terdeteksi'],
            'disconnected'     => ['link_down',  'high',     'Perangkat Terputus'],
            'critical'         => ['general',    'critical', 'Log Critical Terdeteksi'],
            'error'            => ['general',    'high',     'Log Error Terdeteksi'],
            'warning'          => ['general',    'medium',   'Log Warning Terdeteksi'],
        ];

        foreach ($logs as $log) {
            $msg   = strtolower($log['message'] ?? '');
            $topic = strtolower($log['topics'] ?? '');
            $time  = $log['time'] ?? '';

            foreach ($patterns as $keyword => [$type, $severity, $title]) {
                if (str_contains($msg, $keyword) || str_contains($topic, $keyword)) {
                    $alarms[] = [
                        'type'     => $type,
                        'severity' => $severity,
                        'title'    => strtoupper($severity) . ': ' . $title,
                        'detail'   => '[' . ($log['topics'] ?? 'system') . '] ' . ($log['message'] ?? ''),
                        'time'     => $time,
                    ];
                    break; // Satu log, satu alarm
                }
            }
        }

        // Hapus duplikat berdasarkan kombinasi type + detail
        $seen   = [];
        $unique = [];
        foreach ($alarms as $alarm) {
            $key = $alarm['type'] . '|' . $alarm['detail'];
            if (!in_array($key, $seen)) {
                $seen[]   = $key;
                $unique[] = $alarm;
            }
        }

        return $unique;
    }

    // ─── ENDPOINT UTAMA ───────────────────────────────────────────────────────
    public function getDashboardStats()
    {
        // Ambil credentials dari tabel settings
        $settings = Setting::whereIn('key', ['apiIp', 'apiPort', 'apiUser', 'apiPass'])
                           ->pluck('value', 'key');

        $apiIp   = $settings->get('apiIp');
        $apiPort = $settings->get('apiPort', '8728');
        $apiUser = $settings->get('apiUser');
        $apiPass = $settings->get('apiPass', '');

        // Fallback ke Demo Mode jika belum dikonfigurasi
        if (empty($apiIp) || empty($apiUser)) {
            return response()->json($this->getDemoData(), 200);
        }

        try {
            $client = new Client([
                'host'    => $apiIp,
                'user'    => $apiUser,
                'pass'    => $apiPass,
                'port'    => (int) $apiPort,
                'timeout' => 3,
            ]);

            // 1. CPU Load & Uptime
            $resource = $client->query(new Query('/system/resource/print'))->read();

            // 2. Live Syslog (20 log terakhir untuk deteksi alarm lebih akurat)
            $logs     = $client->query(new Query('/log/print'))->read();
            $recentLogs = array_reverse(array_slice($logs, -20));

            // 3. Smart Alarm Detection dari syslog
            $alarms = $this->detectAlarms($recentLogs);

            // 4. Traffic real-time dari interface WAN
            $traffic = 0;
            try {
                $queryTraffic = (new Query('/interface/monitor-traffic'))
                    ->equal('interface', 'ether1')
                    ->equal('once', '');
                $trafficData = $client->query($queryTraffic)->read();
                $rxBps   = $trafficData[0]['rx-bits-per-second'] ?? 0;
                $txBps   = $trafficData[0]['tx-bits-per-second'] ?? 0;
                $traffic = round(($rxBps + $txBps) / 1_000_000);
            } catch (\Exception $e) {
                // Interface ether1 tidak ditemukan, traffic = 0
            }

            return response()->json([
                'is_demo' => false,
                'success' => true,
                'data'    => [
                    'status'    => 'ONLINE',
                    'uptime'    => $resource[0]['uptime'] ?? '0s',
                    'cpu_load'  => (int) ($resource[0]['cpu-load'] ?? 0),
                    'traffic'   => $traffic,
                    'logs'      => array_slice($recentLogs, 0, 10), // tampilkan 10 di UI
                    'alarms'    => $alarms,
                ],
            ], 200);

        } catch (\Exception $e) {
            // Koneksi gagal → fallback Demo Mode + log error
            $demo = $this->getDemoData();
            array_unshift($demo['data']['logs'], [
                'time'    => now()->format('H:i:s'),
                'topics'  => 'error',
                'message' => '[SYS] Gagal ke MikroTik: ' . $e->getMessage(),
            ]);
            return response()->json($demo, 200);
        }
    }
}
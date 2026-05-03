<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NetworkNode;
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
                'alarms' => [
                    [
                        'type'     => 'los',
                        'severity' => 'critical',
                        'title'    => 'CRITICAL: LOS (Loss of Signal) Terdeteksi',
                        'detail'   => '[DEMO] OLT Port PON 2: Redaman sangat buruk terpantau di ODP area Jl. Sumatera (Pelanggan: Siti Aminah). Rx Power: -32.1 dBm.',
                        'time'     => '17:28:44',
                    ],
                ],
                // Demo device list — kaya visualisasi
                'devices' => [
                    [
                        'id'       => 1,
                        'name'     => 'MikroTik CCR1036 (Core)',
                        'type'     => 'server',
                        'ip'       => '10.10.10.1',
                        'status'   => 'online',
                        'latency'  => 2,
                        'uptime'   => '45d 2h 10m',
                        'cpu'      => 18,
                        'clients'  => 142,
                        'location' => 'NOC Utama, Lt. 2',
                    ],
                    [
                        'id'       => 2,
                        'name'     => 'OLT ZTE C320',
                        'type'     => 'server',
                        'ip'       => '10.10.10.2',
                        'status'   => 'online',
                        'latency'  => 4,
                        'uptime'   => '45d 2h 9m',
                        'cpu'      => 34,
                        'clients'  => 87,
                        'location' => 'Rack NOC, Slot A1',
                    ],
                    [
                        'id'       => 3,
                        'name'     => 'ODC Jl. Sudirman',
                        'type'     => 'odc',
                        'ip'       => '10.10.20.1',
                        'status'   => 'online',
                        'latency'  => 8,
                        'uptime'   => '30d 14h 22m',
                        'cpu'      => null,
                        'clients'  => 32,
                        'location' => 'Tiang Persimpangan Sudirman-Thamrin',
                    ],
                    [
                        'id'       => 4,
                        'name'     => 'ODC Jl. Gatot Subroto',
                        'type'     => 'odc',
                        'ip'       => '10.10.20.2',
                        'status'   => 'warning',
                        'latency'  => 38,
                        'uptime'   => '30d 14h 20m',
                        'cpu'      => null,
                        'clients'  => 18,
                        'location' => 'Tiang Depan Pertamina Tower',
                    ],
                    [
                        'id'       => 5,
                        'name'     => 'ODC Jl. Sumatera',
                        'type'     => 'odc',
                        'ip'       => '10.10.20.5',
                        'status'   => 'offline',
                        'latency'  => null,
                        'uptime'   => null,
                        'cpu'      => null,
                        'clients'  => 0,
                        'location' => 'Tiang depan SMA Negeri 3',
                    ],
                    [
                        'id'       => 6,
                        'name'     => 'Switch Distribusi Sektor-B',
                        'type'     => 'odc',
                        'ip'       => '10.10.30.1',
                        'status'   => 'online',
                        'latency'  => 5,
                        'uptime'   => '12d 4h 37m',
                        'cpu'      => 9,
                        'clients'  => 55,
                        'location' => 'Gedung Teknis, Lantai 1',
                    ],
                ],
                // Demo ONT/CPE data
                'ont_devices' => [
                    [
                        'customer_name' => 'Siti Aminah',
                        'ip'            => '192.168.1.11',
                        'mac'           => 'E5:F6:A7:B8',
                        'rx_dbm'        => -32.1,
                        'status'        => 'los',
                        'package'       => 'Paket 20 Mbps',
                    ],
                    [
                        'customer_name' => 'Budi Santoso',
                        'ip'            => '192.168.1.25',
                        'mac'           => 'A1:B2:C3:D4',
                        'rx_dbm'        => -18.5,
                        'status'        => 'online',
                        'package'       => 'Paket 50 Mbps',
                    ],
                    [
                        'customer_name' => 'PT. Maju Jaya',
                        'ip'            => '192.168.1.40',
                        'mac'           => 'F1:E2:D3:C4',
                        'rx_dbm'        => -21.3,
                        'status'        => 'online',
                        'package'       => 'Paket Bisnis 100 Mbps',
                    ],
                    [
                        'customer_name' => 'Rina Dewi',
                        'ip'            => '192.168.1.62',
                        'mac'           => '11:22:33:44',
                        'rx_dbm'        => -26.8,
                        'status'        => 'warning',
                        'package'       => 'Paket 20 Mbps',
                    ],
                ],
            ]
        ];
    }

    // ─── SMART ALARM DETECTOR ────────────────────────────────────────────────
    private function detectAlarms(array $logs): array
    {
        $alarms = [];
        $patterns = [
            'loss of signal' => ['los',       'critical', 'Loss of Signal (LOS) Terdeteksi'],
            'los detected'   => ['los',       'critical', 'Loss of Signal (LOS) Terdeteksi'],
            'link down'      => ['link_down', 'critical', 'Link Down Terdeteksi'],
            'interface down' => ['link_down', 'critical', 'Interface Down Terdeteksi'],
            'disconnected'   => ['link_down', 'high',     'Perangkat Terputus'],
            'critical'       => ['general',   'critical', 'Log Critical Terdeteksi'],
            'error'          => ['general',   'high',     'Log Error Terdeteksi'],
            'warning'        => ['general',   'medium',   'Log Warning Terdeteksi'],
        ];

        foreach ($logs as $log) {
            $msg   = strtolower($log['message'] ?? '');
            $topic = strtolower($log['topics']  ?? '');
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
                    break;
                }
            }
        }

        // Hapus duplikat
        $seen = [];
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

    // ─── HEALTH CHECK PERANGKAT via MikroTik Ping ────────────────────────────
    /**
     * Ping satu IP melalui MikroTik API, return latency (ms) atau null jika timeout.
     */
    private function pingDevice(Client $client, string $ip): ?int
    {
        try {
            $query = (new Query('/ping'))
                ->equal('address', $ip)
                ->equal('count', '2');
            $result = $client->query($query)->read();

            // Cari avg-rtt dari hasil ping
            foreach ($result as $row) {
                if (isset($row['avg-rtt'])) {
                    // Format biasanya "2ms" atau "2.5ms"
                    return (int) filter_var($row['avg-rtt'], FILTER_SANITIZE_NUMBER_INT);
                }
            }
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    // ─── ENDPOINT UTAMA ───────────────────────────────────────────────────────
    public function getDashboardStats()
    {
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
            $resource   = $client->query(new Query('/system/resource/print'))->read();

            // 2. Live Syslog (20 log terakhir)
            $logs       = $client->query(new Query('/log/print'))->read();
            $recentLogs = array_reverse(array_slice($logs, -20));

            // 3. Smart Alarm Detection
            $alarms = $this->detectAlarms($recentLogs);

            // 4. Traffic WAN real-time
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
                // Interface tidak ditemukan
            }

            // 5. Health Check Perangkat dari tabel network_nodes
            $nodes   = NetworkNode::whereIn('type', ['server', 'odc'])
                                  ->select('id', 'name', 'type', 'description', 'status')
                                  ->get();

            $devices = $nodes->map(function ($node) use ($client) {
                // Ekstrak IP dari description jika ada (format: "IP: 10.10.10.1 | ...")
                preg_match('/\b(\d{1,3}(?:\.\d{1,3}){3})\b/', $node->description ?? '', $ipMatch);
                $ip = $ipMatch[1] ?? null;

                $latency      = null;
                $deviceStatus = $node->status; // status dari DB: aktif/los/offline

                if ($ip) {
                    $latency = $this->pingDevice($client, $ip);
                    // Override status berdasarkan hasil ping real
                    if ($latency === null) {
                        $deviceStatus = 'offline';
                    } elseif ($latency > 30) {
                        $deviceStatus = 'warning';
                    } else {
                        $deviceStatus = 'online';
                    }
                }

                return [
                    'id'       => $node->id,
                    'name'     => $node->name,
                    'type'     => $node->type,
                    'ip'       => $ip ?? '-',
                    'status'   => $deviceStatus,
                    'latency'  => $latency,
                    'uptime'   => null, // Tidak tersedia tanpa SNMP per device
                    'cpu'      => null,
                    'clients'  => null,
                    'location' => $node->description,
                ];
            })->values()->toArray();

            return response()->json([
                'is_demo' => false,
                'success' => true,
                'data'    => [
                    'status'      => 'ONLINE',
                    'uptime'      => $resource[0]['uptime']   ?? '0s',
                    'cpu_load'    => (int) ($resource[0]['cpu-load'] ?? 0),
                    'traffic'     => $traffic,
                    'logs'        => array_slice($recentLogs, 0, 10),
                    'alarms'      => $alarms,
                    'devices'     => $devices,
                    'ont_devices' => [], // Real ONT data perlu integrasi OLT
                ],
            ], 200);

        } catch (\Exception $e) {
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
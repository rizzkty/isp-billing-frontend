<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use RouterOS\Client;
use RouterOS\Query;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class NocController extends Controller
{
    /**
     * Singleton connection per request lifecycle.
     * Tidak buka koneksi baru kalau sudah ada.
     */
    private static ?Client $client = null;

    private function connectMikrotik(): Client
    {
        if (self::$client !== null) {
            return self::$client;
        }

        // Cache settings 60 detik — tidak query DB setiap request
        $settings = Cache::remember('mikrotik_settings', 60, function () {
            return Setting::pluck('value', 'key')->toArray();
        });

        $host = $settings['apiIp']   ?? '192.168.1.1';
        $user = $settings['apiUser'] ?? 'admin';
        $pass = $settings['apiPass'] ?? '';
        $port = (int)($settings['apiPort'] ?? 8728);

        // Validasi dulu sebelum konek
        if (empty($host) || empty($user)) {
            throw new \RuntimeException('Konfigurasi MikroTik belum lengkap.');
        }

        self::$client = new Client([
            'host'     => $host,
            'user'     => $user,
            'pass'     => $pass,
            'port'     => $port,
            'timeout'  => 5,   // jangan tunggu lebih dari 5 detik
            'attempts' => 1,   // jangan retry — langsung fail cepat
        ]);

        return self::$client;
    }

    public function getLiveMonitor()
    {
        try {
            $client = $this->connectMikrotik();

            // ── 1. CPU & Uptime ──────────────────────────────────────
            $resource = $client->query(new Query('/system/resource/print'))->read();
            $cpuLoad  = $resource[0]['cpu-load'] ?? 0;
            $uptime   = $resource[0]['uptime']   ?? '0s';

            // ── 2. Log 10 terbaru ────────────────────────────────────
            $logQuery = (new Query('/log/print'))
                ->equal('.proplist', 'time,topics,message');
            $logs          = $client->query($logQuery)->read();
            $formattedLogs = [];
            foreach (array_slice($logs, -10) as $log) {
                $formattedLogs[] = [
                    'time'    => $log['time']    ?? '--:--',
                    'topics'  => $log['topics']  ?? 'system',
                    'message' => $log['message'] ?? '',
                ];
            }

            // ── 3. Traffic ───────────────────────────────────────────
            // Ambil nama interface dari DB (juga di-cache)
            $cachedSettings = Cache::get('mikrotik_settings', []);
            $namaIsp1 = $cachedSettings['isp1Interface'] ?? 'ether4-INET';
            $namaIsp2 = $cachedSettings['isp2Interface'] ?? 'ether7-Tsel';

            $trafficData = [
                'isp1' => ['tx' => 0, 'rx' => 0, 'total' => 0],
                'isp2' => ['tx' => 0, 'rx' => 0, 'total' => 0],
            ];

            $this->fillTraffic($client, $namaIsp1, $trafficData['isp1']);
            $this->fillTraffic($client, $namaIsp2, $trafficData['isp2']);

            return response()->json([
                'success' => true,
                'data'    => [
                    'cpu_load' => $cpuLoad,
                    'uptime'   => $uptime,
                    'logs'     => $formattedLogs,
                    'traffic'  => $trafficData,
                    'alarms'   => [],
                    'devices'  => [],
                    'ont_devices' => [],
                ],
            ]);

        } catch (\RuntimeException $e) {
            // Konfigurasi belum diisi — jangan log sebagai error
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'code'    => 'CONFIG_MISSING',
            ], 422);

        } catch (\Exception $e) {
            // Reset singleton supaya request berikutnya coba reconnect
            self::$client = null;

            Log::warning('MikroTik connection failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal terhubung ke MikroTik: ' . $e->getMessage(),
                'code'    => 'CONNECTION_ERROR',
            ], 500);
        }
    }

    /**
     * Helper — isi array traffic dari satu interface.
     * Kalau interface tidak ada, nilai tetap 0 (tidak throw).
     */
    private function fillTraffic(Client $client, string $interface, array &$target): void
    {
        try {
            $res = $client->query(
                (new Query('/interface/monitor-traffic'))
                    ->equal('interface', $interface)
                    ->equal('once', '')
            )->read();

            if (!empty($res[0])) {
                $target['tx']    = round((int)($res[0]['tx-bits-per-second'] ?? 0) / 1_000_000, 2);
                $target['rx']    = round((int)($res[0]['rx-bits-per-second'] ?? 0) / 1_000_000, 2);
                $target['total'] = $target['tx'] + $target['rx'];
            }
        } catch (\Exception $e) {
            // Interface tidak ditemukan — biarkan 0, jangan crash seluruh response
            Log::debug("Traffic query failed for [{$interface}]: " . $e->getMessage());
        }
    }

    /**
     * Invalidate cache settings saat pengaturan disimpan.
     * Panggil method ini dari SettingsController setelah save.
     */
    public static function clearSettingsCache(): void
    {
        Cache::forget('mikrotik_settings');
        self::$client = null; // force reconnect dengan settings baru
    }
}
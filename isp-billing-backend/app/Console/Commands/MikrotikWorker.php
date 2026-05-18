<?php
// app/Console/Commands/MikrotikWorker.php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Setting;
use RouterOS\Client;
use RouterOS\Query;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MikrotikWorker extends Command
{
    protected $signature   = 'mikrotik:worker';
    protected $description = 'Worker koneksi persisten ke MikroTik — login sekali, update cache terus';

    public function handle()
    {
        $this->info('[Worker] Starting MikroTik persistent worker...');

        while (true) {
            try {
                $settings = Setting::pluck('value', 'key')->toArray();

                $client = new Client([
                    'host'     => $settings['apiIp']   ?? '192.168.1.1',
                    'user'     => $settings['apiUser'] ?? 'admin',
                    'pass'     => $settings['apiPass'] ?? '',
                    'port'     => (int)($settings['apiPort'] ?? 8728),
                    'timeout'  => 10,
                    'attempts' => 2,
                ]);

                $this->info('[Worker] Connected to MikroTik. Starting data loop...');

                // Loop dalam — selama koneksi masih hidup
                while (true) {
                    $data = $this->collectData($client, $settings);
                    
                    // Simpan ke cache 60 detik
                    // Kalau worker mati, cache expired → frontend tahu ada masalah
                    Cache::put('noc_live_data', $data, 60);

                    $this->line('[Worker] Data updated at ' . now()->format('H:i:s'));
                    sleep(10); // update tiap 10 detik
                }

            } catch (\Exception $e) {
                Log::error('[Worker] Error: ' . $e->getMessage());
                $this->error('[Worker] Connection lost: ' . $e->getMessage());
                $this->warn('[Worker] Reconnecting in 15 seconds...');
                
                // Tandai koneksi mati di cache
                Cache::put('noc_worker_error', $e->getMessage(), 30);
                sleep(15); // tunggu sebelum reconnect
            }
        }
    }

    private function collectData(Client $client, array $settings): array
    {
        // CPU & Uptime
        $resource = $client->query(new Query('/system/resource/print'))->read();
        $cpuLoad  = $resource[0]['cpu-load'] ?? 0;
        $uptime   = $resource[0]['uptime']   ?? '0s';

        // Log 10 terbaru
        $logs = $client->query(
            (new Query('/log/print'))->equal('.proplist', 'time,topics,message')
        )->read();

        $formattedLogs = [];
        foreach (array_slice($logs, -10) as $log) {
            $formattedLogs[] = [
                'time'    => $log['time']    ?? '--:--',
                'topics'  => $log['topics']  ?? 'system',
                'message' => $log['message'] ?? '',
            ];
        }

        // Traffic ISP 1
        $isp1 = ['tx' => 0, 'rx' => 0, 'total' => 0];
        $isp2 = ['tx' => 0, 'rx' => 0, 'total' => 0];

        try {
            $res1 = $client->query(
                (new Query('/interface/monitor-traffic'))
                    ->equal('interface', $settings['isp1Interface'] ?? 'ether4-INET')
                    ->equal('once', '')
            )->read();
            if (!empty($res1[0])) {
                $isp1['tx']    = round((int)($res1[0]['tx-bits-per-second'] ?? 0) / 1_000_000, 2);
                $isp1['rx']    = round((int)($res1[0]['rx-bits-per-second'] ?? 0) / 1_000_000, 2);
                $isp1['total'] = $isp1['tx'] + $isp1['rx'];
            }
        } catch (\Exception $e) { /* interface tidak ada, biarkan 0 */ }

        try {
            $res2 = $client->query(
                (new Query('/interface/monitor-traffic'))
                    ->equal('interface', $settings['isp2Interface'] ?? 'ether7-Tsel')
                    ->equal('once', '')
            )->read();
            if (!empty($res2[0])) {
                $isp2['tx']    = round((int)($res2[0]['tx-bits-per-second'] ?? 0) / 1_000_000, 2);
                $isp2['rx']    = round((int)($res2[0]['rx-bits-per-second'] ?? 0) / 1_000_000, 2);
                $isp2['total'] = $isp2['tx'] + $isp2['rx'];
            }
        } catch (\Exception $e) { /* interface tidak ada, biarkan 0 */ }

        return [
            'cpu_load'   => $cpuLoad,
            'uptime'     => $uptime,
            'logs'       => $formattedLogs,
            'traffic'    => ['isp1' => $isp1, 'isp2' => $isp2],
            'alarms'     => [],
            'devices'    => [],
            'ont_devices'=> [],
            'updated_at' => now()->toISOString(),
        ];
    }
}
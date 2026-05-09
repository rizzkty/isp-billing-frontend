<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Setting;
use RouterOS\Client;
use RouterOS\Query;
use App\Events\MikrotikTrafficUpdated;

class BroadcastTraffic extends Command
{
    protected $signature = 'mikrotik:broadcast-traffic';
    protected $description = 'Tarik traffic Mikrotik dan siarkan via WebSocket terus-menerus';

    public function handle()
    {
        $this->info('Memulai siaran langsung Traffic MikroTik...');

        $settings = Setting::pluck('value', 'key')->toArray();
        
        try {
            // Kita buka 1 koneksi saja, lalu ditahan agar tidak login berulang kali
            $client = new Client([
                'host' => $settings['apiIp'] ?? '192.168.1.1',
                'user' => $settings['apiUser'] ?? 'admin',
                'pass' => $settings['apiPass'] ?? '',
                'port' => (int)($settings['apiPort'] ?? 8728),
            ]);

            // Looping tanpa henti (Infinite Loop)
            while (true) {
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

                // Siarkan datanya!
                broadcast(new MikrotikTrafficUpdated($data));

                // Jeda 2 detik sebelum narik data lagi agar CPU aman
                sleep(2); 
            }

        } catch (\Exception $e) {
            $this->error('Koneksi terputus: ' . $e->getMessage());
        }
    }
}
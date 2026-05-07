<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\Setting;
use App\Models\NetworkNode;
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

    public function getDashboardStats()
    {
        $data = Cache::remember('noc_stats', 300, function () {
            $settings = Setting::whereIn('key', ['apiIp', 'apiPort', 'apiUser', 'apiPass'])
                               ->pluck('value', 'key');

            $apiIp      = $settings->get('apiIp');
            $apiPort    = $settings->get('apiPort', '8728');
            $apiUser    = $settings->get('apiUser');
            $apiPassRaw = $settings->get('apiPass', '');

            try {
                $apiPass = !empty($apiPassRaw)
                    ? \Illuminate\Support\Facades\Crypt::decryptString($apiPassRaw)
                    : '';
            } catch (\Exception $e) {
                $apiPass = $apiPassRaw;
            }

            if (empty($apiIp) || empty($apiUser)) {
                return $this->getDemoData();
            }

            try {
                $client = new Client([
                    'host'    => $apiIp,
                    'user'    => $apiUser,
                    'pass'    => $apiPass,
                    'port'    => (int) $apiPort,
                    'timeout' => 3,
                ]);

                $resource   = $client->query(new Query('/system/resource/print'))->read();
                $logs       = $client->query(new Query('/log/print'))->read();
                $recentLogs = array_reverse(array_slice($logs, -20));
                $alarms     = $this->detectAlarms($recentLogs);

                $traffic = 0;
                try {
                    $queryTraffic = (new Query('/interface/monitor-traffic'))
                        ->equal('interface', 'ether1')
                        ->equal('once', '');
                    $trafficData = $client->query($queryTraffic)->read();
                    $rxBps   = $trafficData[0]['rx-bits-per-second'] ?? 0;
                    $txBps   = $trafficData[0]['tx-bits-per-second'] ?? 0;
                    $traffic = round(($rxBps + $txBps) / 1_000_000);
                } catch (\Exception $e) {}

                $nodes   = NetworkNode::whereIn('type', ['server', 'odc'])
                                      ->select('id', 'name', 'type', 'description', 'status')
                                      ->get();

                $devices = $nodes->map(function ($node) use ($client) {
                    preg_match('/\b(\d{1,3}(?:\.\d{1,3}){3})\b/', $node->description ?? '', $ipMatch);
                    $ip = $ipMatch[1] ?? null;

                    $latency      = null;
                    $deviceStatus = $node->status;

                    if ($ip) {
                        $latency = $this->pingDevice($client, $ip);
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
                        'uptime'   => null,
                        'cpu'      => null,
                        'clients'  => null,
                        'location' => $node->description,
                    ];
                })->values()->toArray();

                return [
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
                        'ont_devices' => [],
                    ],
                ];

            } catch (\Exception $e) {
                $demo = $this->getDemoData();
                array_unshift($demo['data']['logs'], [
                    'time'    => now()->format('H:i:s'),
                    'topics'  => 'error',
                    'message' => '[SYS] Gagal ke MikroTik: ' . $e->getMessage(),
                ]);
                return $demo;
            }
        });

        return response()->json($data, 200);
    }

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
                'isp2' => ['tx' => 0, 'rx' => 0, 'total' => 0],
            ];

            foreach ($response as $interface) {
                if ($interface['name'] === 'ether4-INET') {
                    $data['isp1']['tx']    = round((int)$interface['tx-bits-per-second'] / 1000000, 2);
                    $data['isp1']['rx']    = round((int)$interface['rx-bits-per-second'] / 1000000, 2);
                    $data['isp1']['total'] = $data['isp1']['tx'] + $data['isp1']['rx'];
                } elseif ($interface['name'] === 'ether7-Tsel') {
                    $data['isp2']['tx']    = round((int)$interface['tx-bits-per-second'] / 1000000, 2);
                    $data['isp2']['rx']    = round((int)$interface['rx-bits-per-second'] / 1000000, 2);
                    $data['isp2']['total'] = $data['isp2']['tx'] + $data['isp2']['rx'];
                }
            }

            return response()->json(['success' => true, 'data' => $data]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
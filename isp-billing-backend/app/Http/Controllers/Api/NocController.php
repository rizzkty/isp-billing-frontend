<?php
// app/Http/Controllers/Api/NocController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SnmpService;
use App\Models\Setting;
use Illuminate\Http\Request; 
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class NocController extends Controller
{
    public function getLiveMonitor()
    {
        try {
            $settings   = Cache::remember('mikrotik_settings', 60, fn() =>
                Setting::pluck('value', 'key')->toArray()
            );

            $isp1Index  = (int)($settings['isp1IfIndex'] ?? 4);
            $isp2Index  = (int)($settings['isp2IfIndex'] ?? 7);

            $cpu_load = 0;
            $uptime = 'Offline';
            $traffic = [
                'isp1' => ['tx' => 0, 'rx' => 0, 'total' => 0],
                'isp2' => ['tx' => 0, 'rx' => 0, 'total' => 0],
            ];
            $snmpError = null;

            try {
                $snmp = new SnmpService();
                $data = $snmp->getLiveData($isp1Index, $isp2Index);
                $cpu_load = $data['cpu_load'] ?? 0;
                $uptime = $data['uptime'] ?? 'Offline';
                $traffic = $data['traffic'] ?? $traffic;
            } catch (\Exception $e) {
                $snmpError = $e->getMessage();
            }

            // Sync Network Nodes (Devices)
            $devices = \App\Models\NetworkNode::whereNotIn('type', ['customer', 'client'])
                ->get()
                ->map(function ($node) {
                    $connectedClients = \App\Models\NetworkNode::where('parent_id', $node->id)
                        ->whereIn('type', ['customer', 'client'])
                        ->count();

                    return [
                        'id' => $node->id,
                        'name' => $node->name,
                        'type' => strtoupper($node->type),
                        'lat' => $node->lat,
                        'lng' => $node->lng,
                        'status' => $node->status ?? 'active',
                        'connected_clients' => $connectedClients,
                        'max_ports' => $node->max_ports ?? 8,
                        'description' => $node->description ?? '',
                    ];
                });

            // Sync Alarms (Active tickets & Isolated customers)
            $tickets = \App\Models\Ticket::with('customer:id,name')
                ->whereIn('status', ['open', 'in_progress'])
                ->get()
                ->map(function ($ticket) {
                    return [
                        'type' => 'ticket',
                        'id' => $ticket->id,
                        'title' => $ticket->title,
                        'priority' => strtoupper($ticket->priority),
                        'status' => $ticket->status,
                        'customer_name' => $ticket->customer->name ?? 'N/A',
                        'created_at' => $ticket->created_at->toISOString(),
                    ];
                });

            $isolatedCustomers = \App\Models\Customer::where('status', 'terisolir')
                ->get()
                ->map(function ($customer) {
                    return [
                        'type' => 'billing',
                        'id' => $customer->id,
                        'title' => 'Layanan Terisolir (Tunggakan belum dibayar)',
                        'priority' => 'HIGH',
                        'status' => 'active',
                        'customer_name' => $customer->name,
                        'created_at' => $customer->updated_at->toISOString(),
                    ];
                });

            $alarms = $tickets->concat($isolatedCustomers);

            // Summary stats
            $totalCustomers = \App\Models\Customer::count();
            $isolatedCount = \App\Models\Customer::where('status', 'terisolir')->count();
            $activeCount = \App\Models\Customer::where('status', 'aktif')->count();
            
            $totalDevices = $devices->count();
            $offlineDevices = $devices->where('status', 'offline')->count();

            $stats = [
                'total_customers' => $totalCustomers,
                'active_customers' => $activeCount,
                'isolated_customers' => $isolatedCount,
                'total_devices' => $totalDevices,
                'offline_devices' => $offlineDevices,
                'active_tickets' => $tickets->count(),
            ];

            // Generate syslog stream
            $timeNow = now()->format('H:i:s');
            $logs = [];
            if ($snmpError) {
                $logs[] = [
                    'time' => $timeNow,
                    'topics' => 'snmp,error',
                    'message' => 'Gagal koneksi ke SNMP Router MikroTik (' . ($settings['apiIp'] ?? '192.168.1.1') . '). Menggunakan fallback data database.'
                ];
            } else {
                $logs[] = [
                    'time' => $timeNow,
                    'topics' => 'snmp,info',
                    'message' => 'Koneksi SNMP ke Router MikroTik berhasil. Membaca load dan traffic interface.'
                ];
            }

            $logs[] = [
                'time' => $timeNow,
                'topics' => 'system,info',
                'message' => "Sinkronisasi database NOC selesai: {$totalDevices} perangkat & {$totalCustomers} pelanggan terpantau."
            ];

            if ($isolatedCount > 0) {
                $logs[] = [
                    'time' => $timeNow,
                    'topics' => 'billing,warn',
                    'message' => "Terdeteksi {$isolatedCount} pelanggan berstatus Terisolir karena belum melakukan pelunasan tagihan."
                ];
            }

            if ($tickets->count() > 0) {
                $logs[] = [
                    'time' => $timeNow,
                    'topics' => 'ticket,warn',
                    'message' => "Terdapat {$tickets->count()} tiket gangguan pelanggan aktif yang belum diselesaikan."
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'cpu_load' => $cpu_load,
                    'uptime' => $uptime,
                    'traffic' => $traffic,
                    'devices' => $devices,
                    'alarms' => $alarms,
                    'stats' => $stats,
                    'logs' => $logs,
                    'snmp_connected' => $snmpError === null
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('[NOC] getLiveMonitor error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat monitoring NOC: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getRadiusSessions()
{
    try {
        $snmp = new SnmpService();
        // Reuse method dari NetworkMapController — ambil dari trait/service
        // Untuk sementara panggil langsung via NetworkMapController logic
        $controller = new \App\Http\Controllers\Api\NetworkMapController();
        $reflection = new \ReflectionMethod($controller, 'getRadiusSessions');
        $reflection->setAccessible(true);
        $data = $reflection->invoke($controller);

        return response()->json(['success' => true, 'data' => $data]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

   public function testSnmp(Request $request)
{
    try {
        $snmp   = new SnmpService(
            $request->input('apiIp'),
            $request->input('snmpCommunity')
        );
        $result = $snmp->testConnection();
        return response()->json($result);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
        ], 500);
    }
}

public function __construct(?string $host = null, ?string $community = null)
{
    if ($host && $community) {
        // Pakai parameter langsung (untuk test sebelum disimpan)
        $this->host      = $host;
        $this->community = $community;
    } else {
        // Ambil dari DB/cache (untuk polling normal)
        $settings = Cache::remember('mikrotik_settings', 60, function () {
            return Setting::pluck('value', 'key')->toArray();
        });
        $this->host      = $settings['apiIp']         ?? '192.168.1.1';
        $this->community = $settings['snmpCommunity'] ?? 'public';
    }

    $this->timeout = 1000000;
    $this->retries = 1;
}
    // Untuk halaman pengaturan — ambil daftar interface
    public function getInterfaceList()
    {
        try {
            $snmp       = new SnmpService();
            $interfaces = $snmp->getInterfaceList();
            return response()->json(['success' => true, 'data' => $interfaces]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // Invalidate cache saat settings disimpan
    public static function clearSettingsCache(): void
    {
        Cache::forget('mikrotik_settings');
    }
}
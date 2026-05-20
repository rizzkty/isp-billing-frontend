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

            $snmp = new SnmpService();
            $data = $snmp->getLiveData($isp1Index, $isp2Index);

            return response()->json(['success' => true, 'data' => $data]);

        } catch (\Exception $e) {
            Log::error('[NOC] getLiveMonitor error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data SNMP: ' . $e->getMessage(),
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
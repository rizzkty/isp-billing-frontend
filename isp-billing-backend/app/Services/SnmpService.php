<?php
// app/Services/SnmpService.php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SnmpService
{
    private string $host;
    private string $community;
    private int    $timeout;   // microseconds
    private int    $retries;

    // OID konstanta
    const OID_CPU_LOAD    = '1.3.6.1.2.1.25.3.3.1.2.1';
    const OID_UPTIME      = '1.3.6.1.2.1.1.3.0';
    const OID_SYS_NAME    = '1.3.6.1.2.1.1.5.0';
    const OID_IF_DESCR    = '1.3.6.1.2.1.2.2.1.2';   // + .{index}
    const OID_IF_IN_OCTETS  = '1.3.6.1.2.1.2.2.1.10'; // + .{index}
    const OID_IF_OUT_OCTETS = '1.3.6.1.2.1.2.2.1.16'; // + .{index}
    const OID_IF_SPEED    = '1.3.6.1.2.1.2.2.1.5';    // + .{index}

    public function __construct(?string $host = null, ?string $community = null)
    {
        if (!function_exists('snmpget')) {
            throw new \Exception('Ekstensi PHP SNMP tidak terinstall pada server ini.');
        }

        if ($host !== null && $community !== null) {
            $this->host      = $host;
            $this->community = $community;
        } else {
            $settings = Cache::remember('mikrotik_settings', 60, function () {
                return Setting::pluck('value', 'key')->toArray();
            });

            $this->host      = $settings['apiIp']        ?? '192.168.1.1';
            $this->community = $settings['snmpCommunity'] ?? 'public';
        }
        $this->timeout   = 1000000; // 1 detik
        $this->retries   = 1;
    }

    /**
     * Ambil semua data monitoring sekaligus
     */
    public function getLiveData(int $isp1Index, int $isp2Index): array
    {
        return [
            'cpu_load'    => $this->getCpuLoad(),
            'uptime'      => $this->getUptime(),
            'traffic'     => [
                'isp1' => $this->getTraffic($isp1Index),
                'isp2' => $this->getTraffic($isp2Index),
            ],
            'logs'        => [], // SNMP tidak punya akses syslog
            'alarms'      => [],
            'devices'     => [],
            'ont_devices' => [],
            'updated_at'  => now()->toISOString(),
        ];
    }

    public function getCpuLoad(): int
    {
        try {
            $raw = snmpget(
                $this->host, $this->community,
                self::OID_CPU_LOAD,
                $this->timeout, $this->retries
            );
            return (int) $this->parseSnmpValue($raw);
        } catch (\Exception $e) {
            Log::debug('[SNMP] getCpuLoad error: ' . $e->getMessage());
            return 0;
        }
    }

    public function getUptime(): string
    {
        try {
            $raw = snmpget(
                $this->host, $this->community,
                self::OID_UPTIME,
                $this->timeout, $this->retries
            );
            // Format: "Timeticks: (123456) 0:20:34.56" → kita format ulang
            return $this->formatUptime($raw);
        } catch (\Exception $e) {
            Log::debug('[SNMP] getUptime error: ' . $e->getMessage());
            return '0s';
        }
    }

    /**
     * Ambil traffic interface — return dalam Mbps
     * Pakai dua sample dengan jeda 1 detik untuk hitung rate
     */
   public function getTraffic(int $ifIndex): array
{
    try {
        $oidIn  = self::OID_IF_IN_OCTETS  . '.' . $ifIndex;
        $oidOut = self::OID_IF_OUT_OCTETS . '.' . $ifIndex;

        // Sample 1
        $in1  = (int) $this->parseSnmpValue(snmpget($this->host, $this->community, $oidIn,  $this->timeout, $this->retries));
        $out1 = (int) $this->parseSnmpValue(snmpget($this->host, $this->community, $oidOut, $this->timeout, $this->retries));

        sleep(3); // naikkan jadi 3 detik agar lebih akurat

        // Sample 2
        $in2  = (int) $this->parseSnmpValue(snmpget($this->host, $this->community, $oidIn,  $this->timeout, $this->retries));
        $out2 = (int) $this->parseSnmpValue(snmpget($this->host, $this->community, $oidOut, $this->timeout, $this->retries));

        $interval = 3; // sesuai sleep di atas

        // Hitung rate (octets/s → Mbps)
        // ifInOctets  = traffic masuk ke router dari ISP → Rx (download pelanggan)
        // ifOutOctets = traffic keluar dari router ke ISP → Tx (upload pelanggan)
        $rxMbps = round(($in2  - $in1)  * 8 / 1_000_000 / $interval, 2);
        $txMbps = round(($out2 - $out1) * 8 / 1_000_000 / $interval, 2);

        // Guard nilai negatif (counter wrap 32-bit)
        if ($rxMbps < 0) {
            $rxMbps = round((4294967295 - $in1 + $in2) * 8 / 1_000_000 / $interval, 2);
        }
        if ($txMbps < 0) {
            $txMbps = round((4294967295 - $out1 + $out2) * 8 / 1_000_000 / $interval, 2);
        }

        return [
            'rx'    => $rxMbps,
            'tx'    => $txMbps,
            'total' => round($rxMbps + $txMbps, 2),
        ];
    } catch (\Exception $e) {
        Log::debug('[SNMP] getTraffic error ifIndex=' . $ifIndex . ': ' . $e->getMessage());
        return ['rx' => 0, 'tx' => 0, 'total' => 0];
    }
}

    /**
     * Walk semua interface — untuk halaman pengaturan
     */
    public function getInterfaceList(): array
    {
        try {
            $raw = snmpwalk(
                $this->host, $this->community,
                self::OID_IF_DESCR,
                $this->timeout, $this->retries
            );

            $interfaces = [];
            foreach ($raw as $oid => $value) {
                // Extract index dari OID terakhir
                preg_match('/\.(\d+)$/', $oid, $match);
                $index = $match[1] ?? null;
                $name  = $this->parseSnmpValue($value);

                if ($index && $name) {
                    $interfaces[] = [
                        'index' => (int) $index,
                        'name'  => $name,
                    ];
                }
            }
            return $interfaces;
        } catch (\Exception $e) {
            Log::error('[SNMP] getInterfaceList error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Test koneksi SNMP — untuk halaman pengaturan
     */
    public function testConnection(): array
    {
        try {
            $sysName = snmpget(
                $this->host, $this->community,
                self::OID_SYS_NAME,
                $this->timeout, $this->retries
            );
            return [
                'success'  => true,
                'message'  => 'Terhubung ke ' . $this->parseSnmpValue($sysName),
                'hostname' => $this->parseSnmpValue($sysName),
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Gagal: ' . $e->getMessage(),
            ];
        }
    }

    // ── Helpers ───────────────────────────────────────────

    private function parseSnmpValue(string $raw): string
    {
        // Format SNMP: "INTEGER: 31" / "STRING: hostname" / "Timeticks: (123) ..."
        if (strpos($raw, ':') !== false) {
            $parts = explode(':', $raw, 2);
            return trim($parts[1]);
        }
        return trim($raw);
    }

    private function formatUptime(string $raw): string
    {
        // "Timeticks: (7234500) 20:05:45.00" → "20h5m45s"
        preg_match('/\((\d+)\)/', $raw, $ticks);
        if (empty($ticks[1])) return $raw;

        $seconds = (int)($ticks[1] / 100);
        $h = intdiv($seconds, 3600);
        $m = intdiv($seconds % 3600, 60);
        $s = $seconds % 60;

        return "{$h}h{$m}m{$s}s";
    }
}
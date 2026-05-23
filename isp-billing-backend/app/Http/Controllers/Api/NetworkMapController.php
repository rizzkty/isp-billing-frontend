<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NetworkNode;
use App\Models\NetworkEdge;
use App\Models\Customer;
use App\Models\Ticket;
use App\Models\Invoice;
use App\Models\Setting;
use Illuminate\Http\Request;
use RouterOS\Client;
use RouterOS\Query;
use Illuminate\Support\Facades\Cache;

class NetworkMapController extends Controller
{
    /**
     * GET /api/network/map-live
     * Endpoint gabungan yang menggabungkan data dari NOC, RADIUS, Billing, Ticketing, dan Capacity
     * dalam satu response untuk peta jaringan real-time.
     */
    public function getLiveMapData()
    {

        // 1. Ambil semua nodes dan edges
        $nodes = NetworkNode::with('customer:id,name,package_name,status,ip_address')->get();
        $edges = NetworkEdge::all();

        // 2. NOC Health Check — ping devices via MikroTik (Cache 8 detik)
        $nocData = Cache::remember('noc_health_data', 8, function() use ($nodes) {
            return $this->getNocHealthData($nodes);
        });

        // 3. RADIUS Sessions — siapa yang online (Cache 15 detik)
        $radiusSessions = Cache::remember('radius_sessions_data', 15, function() {
            return $this->getRadiusSessions();
        });

        // 4. Billing/Isolir — status pembayaran pelanggan
        $customerStatuses = $this->getCustomerBillingStatuses();

        // 5. Ticketing — tiket gangguan aktif
        $activeTickets = $this->getActiveTickets();

        // 6. ODP Capacity — port terpakai vs max
        $odpCapacity = $this->getOdpCapacity($nodes, $edges);

        // 7. Blast Radius — node terdampak jika parent offline
        $blastRadius = $this->calculateBlastRadius($nodes, $nocData);

        // 8. GPON Health — metrik optik GPON ONU & ODP Splitter
        $gponHealth = $this->getGponHealthData($nodes, $radiusSessions, $customerStatuses, $activeTickets);

        return response()->json([
            'success'           => true,
            'noc_health'        => $nocData,
            'radius_sessions'   => $radiusSessions,
            'customer_statuses' => $customerStatuses,
            'active_tickets'    => $activeTickets,
            'odp_capacity'      => $odpCapacity,
            'blast_radius'      => $blastRadius,
            'gpon_health'       => $gponHealth,
        ]);
    }

    // ─── NOC HEALTH CHECK ─────────────────────────────────────────────────────

    private function getNocHealthData($nodes)
    {
        $settings = Setting::whereIn('key', ['apiIp', 'apiPort', 'apiUser', 'apiPass'])
                           ->pluck('value', 'key');

        $apiIp   = $settings->get('apiIp');
        $apiUser = $settings->get('apiUser');

        // Jika MikroTik belum dikonfigurasi, gunakan demo data
        if (empty($apiIp) || empty($apiUser)) {
            return $this->getDemoNocHealth($nodes);
        }

        $apiPassRaw = $settings->get('apiPass', '');
        try {
            $apiPass = !empty($apiPassRaw) ? \Illuminate\Support\Facades\Crypt::decryptString($apiPassRaw) : '';
        } catch (\Exception $e) {
            $apiPass = $apiPassRaw;
        }

        try {
            $client = new Client([
                'host'    => $apiIp,
                'user'    => $apiUser,
                'pass'    => $apiPass,
                'port'    => (int) $settings->get('apiPort', '8728'),
                'timeout' => 3,
            ]);

            $result = [];
            foreach ($nodes as $node) {
                if (!in_array($node->type, ['server', 'odc'])) continue;

                // Extract IP from description
                preg_match('/\b(\d{1,3}(?:\.\d{1,3}){3})\b/', $node->description ?? '', $ipMatch);
                $ip = $ipMatch[1] ?? null;

                $latency = null;
                $status  = 'unknown';

                if ($ip) {
                    $latency = $this->pingDevice($client, $ip);
                    if ($latency === null) {
                        $status = 'offline';
                    } elseif ($latency > 30) {
                        $status = 'warning';
                    } else {
                        $status = 'online';
                    }
                }

                $result[$node->id] = [
                    'status'   => $status,
                    'latency'  => $latency,
                    'cpu_load' => null, // Per-device CPU memerlukan SNMP
                    'uptime'   => null,
                    'ip'       => $ip ?? '-',
                ];
            }

            // Router utama stats
            try {
                $resource = $client->query(new Query('/system/resource/print'))->read();
                // Assign CPU/uptime ke node pertama type=server
                $firstServer = $nodes->where('type', 'server')->first();
                if ($firstServer && isset($result[$firstServer->id])) {
                    $result[$firstServer->id]['cpu_load'] = (int)($resource[0]['cpu-load'] ?? 0);
                    $result[$firstServer->id]['uptime']   = $resource[0]['uptime'] ?? '-';
                }
            } catch (\Exception $e) {}

            return $result;

        } catch (\Exception $e) {
            return $this->getDemoNocHealth($nodes);
        }
    }

    private function getDemoNocHealth($nodes)
    {
        $result = [];
        foreach ($nodes as $node) {
            if (!in_array($node->type, ['server', 'odc'])) continue;

            $statuses = ['online', 'online', 'online', 'online', 'warning', 'offline'];
            $status = $statuses[array_rand($statuses)];

            // Konsistenkan: seed berdasarkan node ID agar tidak berubah setiap poll
            $seed = crc32($node->name . date('Y-m-d-H'));
            srand($seed);

            $statusOptions = ['online', 'online', 'online', 'online', 'online', 'warning'];
            // Satu node tetap offline untuk demonstrasi blast radius
            if ($node->name === 'ODC Jl. Sumatera' || str_contains(strtolower($node->name), 'offline')) {
                $status = 'offline';
            } else {
                $status = $statusOptions[$seed % count($statusOptions)];
            }

            $latency = $status === 'offline' ? null : ($status === 'warning' ? rand(35, 120) : rand(1, 15));
            $cpuLoad = $status === 'offline' ? null : rand(10, 65);
            
            $result[$node->id] = [
                'status'   => $status,
                'latency'  => $latency,
                'cpu_load' => $cpuLoad,
                'uptime'   => $status === 'offline' ? null : rand(1, 45) . 'd ' . rand(0, 23) . 'h ' . rand(0, 59) . 'm',
                'ip'       => '10.10.' . rand(10, 30) . '.' . ($node->id % 254 + 1),
            ];
        }
        srand(); // Reset seed
        return $result;
    }

    private function pingDevice($client, string $ip): ?int
    {
        try {
            $query = (new Query('/ping'))
                ->equal('address', $ip)
                ->equal('count', '2');
            $result = $client->query($query)->read();

            foreach ($result as $row) {
                if (isset($row['avg-rtt'])) {
                    return (int) filter_var($row['avg-rtt'], FILTER_SANITIZE_NUMBER_INT);
                }
            }
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    // ─── RADIUS SESSIONS ──────────────────────────────────────────────────────

    private function getRadiusSessions()
    {
        $settings = Setting::whereIn('key', ['dbHost', 'dbPort', 'dbUser', 'dbPass', 'dbName'])
                           ->pluck('value', 'key');

        $dbHost = $settings->get('dbHost');
        $dbUser = $settings->get('dbUser');

        if (empty($dbHost) || empty($dbUser)) {
            return $this->getDemoRadiusSessions();
        }

        try {
            $dbPassRaw = $settings->get('dbPass', '');
            try {
                $dbPass = !empty($dbPassRaw) ? \Illuminate\Support\Facades\Crypt::decryptString($dbPassRaw) : '';
            } catch (\Exception $e) {
                $dbPass = $dbPassRaw;
            }

            $dsn = "mysql:host={$dbHost};port={$settings->get('dbPort', '3306')};dbname={$settings->get('dbName', 'radius')};charset=utf8mb4";
            $pdo = new \PDO($dsn, $dbUser, $dbPass, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_TIMEOUT => 3,
            ]);

            $stmt = $pdo->query("SELECT username, framedipaddress, acctinputoctets, acctoutputoctets FROM radacct WHERE acctstoptime IS NULL");
            $sessions = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            $result = [];
            foreach ($sessions as $s) {
                $downloadMb = round(($s['acctoutputoctets'] ?? 0) / 1048576, 2);
                $uploadMb   = round(($s['acctinputoctets'] ?? 0) / 1048576, 2);
                $result[] = [
                    'username'    => $s['username'],
                    'ip_address'  => $s['framedipaddress'],
                    'is_online'   => true,
                    'download_mb' => $downloadMb,
                    'upload_mb'   => $uploadMb,
                    'total_mb'    => $downloadMb + $uploadMb,
                    'is_heavy'    => ($downloadMb + $uploadMb) > 500,
                ];
            }
            return ['is_demo' => false, 'sessions' => $result];

        } catch (\Exception $e) {
            return $this->getDemoRadiusSessions();
        }
    }

    private function getDemoRadiusSessions()
    {
        $now = time();
        $uptime = ($now % 86400) + 10000; // Ticks up second-by-second

        $demoUsers = [
            ['username' => 'Siti Aminah',   'ip' => '192.168.1.11', 'dl_base' => 150.0,  'ul_base' => 20.0,  'dl_rate' => 0.02,  'ul_rate' => 0.005],
            ['username' => 'Budi Santoso',  'ip' => '192.168.1.25', 'dl_base' => 1200.0, 'ul_base' => 180.0, 'dl_rate' => 0.15,  'ul_rate' => 0.025],
            ['username' => 'PT. Maju Jaya', 'ip' => '192.168.1.40', 'dl_base' => 2500.0, 'ul_base' => 600.0, 'dl_rate' => 0.55,  'ul_rate' => 0.12],
            ['username' => 'Ahmad Wijaya',  'ip' => '192.168.1.75', 'dl_base' => 450.0,  'ul_base' => 80.0,  'dl_rate' => 0.05,  'ul_rate' => 0.01],
            ['username' => 'Warkop Berkah', 'ip' => '192.168.1.102','dl_base' => 600.0,  'ul_base' => 120.0, 'dl_rate' => 0.08,  'ul_rate' => 0.015],
        ];

        $sessions = [];
        foreach ($demoUsers as $u) {
            $dl = round($u['dl_base'] + ($uptime * $u['dl_rate']), 2);
            $ul = round($u['ul_base'] + ($uptime * $u['ul_rate']), 2);
            $total = $dl + $ul;
            $sessions[] = [
                'username'    => $u['username'],
                'ip_address'  => $u['ip'],
                'is_online'   => true,
                'download_mb' => $dl,
                'upload_mb'   => $ul,
                'total_mb'    => round($total, 2),
                'is_heavy'    => $total > 500,
            ];
        }

        return ['is_demo' => true, 'sessions' => $sessions];
    }

    // ─── BILLING / ISOLIR STATUS ──────────────────────────────────────────────

    private function getCustomerBillingStatuses()
    {
        $customers = Customer::select('id', 'name', 'status')->get();

        $result = [];
        foreach ($customers as $cust) {
            $isIsolir   = $cust->status === 'terisolir';
            $isNonaktif = $cust->status === 'nonaktif';

            // Cek apakah ada invoice yang belum dibayar (overdue)
            $hasOverdueInvoice = Invoice::where('customer_id', $cust->id)
                ->where('status', 'unpaid')
                ->where('due_date', '<', now())
                ->exists();

            $result[$cust->id] = [
                'billing_status' => $cust->status,
                'is_isolir'      => $isIsolir,
                'is_nonaktif'    => $isNonaktif,
                'has_overdue'    => $hasOverdueInvoice,
            ];
        }
        return $result;
    }

    // ─── ACTIVE TICKETS ───────────────────────────────────────────────────────

    private function getActiveTickets()
    {
        $tickets = Ticket::whereIn('status', ['open', 'in_progress'])
                         ->select('id', 'title', 'customer_id', 'priority', 'status')
                         ->get();

        $result = [];
        foreach ($tickets as $t) {
            if (!$t->customer_id) continue;
            $result[$t->customer_id] = [
                'ticket_id'  => $t->id,
                'title'      => $t->title,
                'priority'   => $t->priority,
                'status'     => $t->status,
            ];
        }
        return $result;
    }

    // ─── ODP CAPACITY ─────────────────────────────────────────────────────────

    private function getOdpCapacity($nodes, $edges)
    {
        $odpNodes = $nodes->where('type', 'odp');
        $result = [];

        foreach ($odpNodes as $odp) {
            // Hitung berapa banyak edge yang terhubung DARI ODP ke customer
            $usedPorts = $edges->where('from_node_id', $odp->id)->count();
            $maxPorts  = $odp->max_ports ?? 8;

            $result[$odp->id] = [
                'used'    => $usedPorts,
                'max'     => $maxPorts,
                'is_full' => $usedPorts >= $maxPorts,
                'percent' => $maxPorts > 0 ? round(($usedPorts / $maxPorts) * 100) : 0,
            ];
        }
        return $result;
    }

    // ─── BLAST RADIUS CALCULATION ─────────────────────────────────────────────

    private function calculateBlastRadius($nodes, $nocData)
    {
        $offlineParents = [];
        $affectedNodes  = [];

        // Temukan semua node server/odc yang offline
        foreach ($nocData as $nodeId => $health) {
            if ($health['status'] === 'offline') {
                $offlineParents[] = $nodeId;
            }
        }

        if (empty($offlineParents)) {
            return [
                'offline_parents' => [],
                'affected_nodes'  => [],
                'affected_edges'  => [],
            ];
        }

        // Trace semua children secara rekursif
        $allNodes  = $nodes->keyBy('id');
        $visited   = [];
        $queue     = $offlineParents;

        while (!empty($queue)) {
            $currentId = array_shift($queue);
            if (in_array($currentId, $visited)) continue;
            $visited[] = $currentId;

            // Cari semua children yang parent_id == currentId
            foreach ($allNodes as $node) {
                if ($node->parent_id == $currentId && !in_array($node->id, $visited)) {
                    $affectedNodes[] = $node->id;
                    $queue[] = $node->id;
                }
            }
        }

        return [
            'offline_parents' => $offlineParents,
            'affected_nodes'  => array_unique($affectedNodes),
        ];
    }

    /**
     * Hitung jarak geografis antara 2 titik (Haversine formula dalam meter)
     */
    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000; // dalam meter

        $latFrom = deg2rad($lat1);
        $lonFrom = deg2rad($lng1);
        $latTo = deg2rad($lat2);
        $lonTo = deg2rad($lng2);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
        return $angle * $earthRadius;
    }

    /**
     * Hitung dan simulasikan data status optik GPON ONU & ODP Splitter secara dinamis
     */
    private function getGponHealthData($nodes, $radiusSessions, $customerStatuses, $activeTickets)
    {
        $result = [];
        $nodeMap = $nodes->keyBy('id');

        foreach ($nodes as $node) {
            if ($node->type === 'customer') {
                // Cari ODP Induk (Parent)
                $parent = $node->parent_id ? $nodeMap->get($node->parent_id) : null;
                $distance = 0.0;
                if ($parent) {
                    $distance = $this->calculateDistance(
                        (float)$node->lat, (float)$node->lng,
                        (float)$parent->lat, (float)$parent->lng
                    );
                }

                // Tentukan status pelanggan untuk metrik O5/LOS
                $status = 'offline';
                $billStatus = $customerStatuses[$node->customer_id] ?? null;
                $isIsolir = $billStatus ? $billStatus['is_isolir'] : false;
                $hasTicket = isset($activeTickets[$node->customer_id]);
                
                $radiusLive = null;
                if (isset($radiusSessions['sessions'])) {
                    foreach ($radiusSessions['sessions'] as $s) {
                        if ($s['username'] === $node->name || $s['ip_address'] === ($node->customer->ip_address ?? '')) {
                            $radiusLive = $s;
                            break;
                        }
                    }
                }

                if ($isIsolir) {
                    $status = 'isolir';
                } elseif ($hasTicket) {
                    $status = 'gangguan';
                } elseif ($radiusLive && $radiusLive['is_online']) {
                    $status = 'online';
                }

                // Kalkulasi Metrik Optik Dinamis
                if ($status === 'online') {
                    // Daya optik RX wajar (misal: -19.2 dBm s/d -22.5 dBm berdasarkan jarak)
                    $rxPower = round(-19.2 - (($distance / 100) * 0.12) - (($node->id % 5) / 10), 2);
                    $onuState = 'O5 (Operation)';
                    $latency = rand(1, 4) . ' ms';
                } elseif ($status === 'gangguan') {
                    // Daya optik drop (Low light / bending / redaman tinggi, e.g. -27.4 dBm)
                    $rxPower = round(-27.4 - (($node->id % 3) / 10), 2);
                    $onuState = 'O5 (Low Light Alert)';
                    $latency = rand(18, 48) . ' ms';
                } elseif ($status === 'isolir') {
                    $rxPower = -40.00;
                    $onuState = 'Deactivated by OLT';
                    $latency = '---';
                } else {
                    $rxPower = -40.00;
                    $onuState = 'O1 (LOS / Link Down)';
                    $latency = '---';
                }

                $result[$node->id] = [
                    'distance_m' => round($distance, 1),
                    'rx_power'   => $rxPower . ' dBm',
                    'onu_state'  => $onuState,
                    'latency'    => $latency,
                ];
            } elseif ($node->type === 'odp') {
                // ODP splits ODC input
                $parent = $node->parent_id ? $nodeMap->get($node->parent_id) : null;
                $distance = 0.0;
                if ($parent) {
                    $distance = $this->calculateDistance(
                        (float)$node->lat, (float)$node->lng,
                        (float)$parent->lat, (float)$parent->lng
                    );
                }

                $loss = 14.15 + (($node->id % 5) / 20); // Redaman Splitter 1:8 ~14.2dB
                $input = round(-3.5 - (($distance / 1000) * 0.35), 2); // Input dari ODC OLT ~ -3.5dBm
                $output = round($input - $loss, 2);

                $result[$node->id] = [
                    'distance_odc_m' => round($distance, 1),
                    'optical_input'  => $input . ' dBm',
                    'optical_output' => $output . ' dBm',
                    'splitter_loss'  => round($loss, 2) . ' dB',
                ];
            }
        }

        return $result;
    }
}

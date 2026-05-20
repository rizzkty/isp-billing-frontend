<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NetworkNode;
use App\Models\NetworkEdge;
use App\Models\Customer;
use App\Models\Ticket;
use App\Models\Invoice;
use App\Models\Setting;
use App\Services\SnmpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Traits\DemoMockTrait;

class NetworkMapController extends Controller
{
    use DemoMockTrait;

    public function getLiveMapData()
    {
        if ($this->isDemoUser()) {
            return response()->json($this->getMockMapLiveData());
        }

        $nodes = NetworkNode::with('customer:id,name,package_name,status,ip_address')->get();
        $edges = NetworkEdge::all();

        $nocData = Cache::remember('noc_health_data', 8, function() use ($nodes) {
            return $this->getNocHealthData($nodes);
        });

        $radiusSessions = Cache::remember('radius_sessions_data', 15, function() {
            return $this->getRadiusSessions();
        });

        $customerStatuses = $this->getCustomerBillingStatuses();
        $activeTickets    = $this->getActiveTickets();
        $odpCapacity      = $this->getOdpCapacity($nodes, $edges);
        $blastRadius      = $this->calculateBlastRadius($nodes, $nocData);

        return response()->json([
            'success'           => true,
            'noc_health'        => $nocData,
            'radius_sessions'   => $radiusSessions,
            'customer_statuses' => $customerStatuses,
            'active_tickets'    => $activeTickets,
            'odp_capacity'      => $odpCapacity,
            'blast_radius'      => $blastRadius,
        ]);
    }

    // ─── NOC HEALTH CHECK via SNMP ────────────────────────────────────────────

    private function getNocHealthData($nodes)
    {
        $settings = Setting::whereIn('key', ['apiIp', 'snmpCommunity'])
                           ->pluck('value', 'key');

        $apiIp     = $settings->get('apiIp');
        $community = $settings->get('snmpCommunity');

        // Jika SNMP belum dikonfigurasi, gunakan demo data
        if (empty($apiIp) || empty($community)) {
            return $this->getDemoNocHealth($nodes);
        }

        try {
            $snmp   = new SnmpService();
            $result = [];

            // Ambil CPU load dan uptime router utama via SNMP
            $cpuLoad = $snmp->getCpuLoad();
            $uptime  = $snmp->getUptime();

            foreach ($nodes as $node) {
                if (!in_array($node->type, ['server', 'odc'])) continue;

                // Untuk node server utama: pakai data SNMP langsung
                if ($node->type === 'server') {
                    $result[$node->id] = [
                        'status'   => 'online',
                        'latency'  => null,
                        'cpu_load' => $cpuLoad,
                        'uptime'   => $uptime,
                        'ip'       => $apiIp,
                    ];
                    continue;
                }

                // Untuk ODC: coba ping via SNMP icmp ping (fallback: status unknown)
                $ip = null;
                preg_match('/\b(\d{1,3}(?:\.\d{1,3}){3})\b/', $node->description ?? '', $ipMatch);
                $ip = $ipMatch[1] ?? null;

                $result[$node->id] = [
                    'status'   => $ip ? 'online' : 'unknown',
                    'latency'  => null,
                    'cpu_load' => null,
                    'uptime'   => null,
                    'ip'       => $ip ?? '-',
                ];
            }

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

            $seed = crc32($node->name . date('Y-m-d-H'));
            srand($seed);

            $statusOptions = ['online', 'online', 'online', 'online', 'online', 'warning'];

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
        srand();
        return $result;
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
                $uploadMb   = round(($s['acctinputoctets']  ?? 0) / 1048576, 2);
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
        $demoUsers = [
            ['username' => 'Siti Aminah',   'ip' => '192.168.1.11',  'dl' => 245.5,  'ul' => 42.3],
            ['username' => 'Budi Santoso',  'ip' => '192.168.1.25',  'dl' => 1850.2, 'ul' => 310.4],
            ['username' => 'PT. Maju Jaya', 'ip' => '192.168.1.40',  'dl' => 3200.8, 'ul' => 890.1],
            ['username' => 'Ahmad Wijaya',  'ip' => '192.168.1.75',  'dl' => 680.0,  'ul' => 120.5],
            ['username' => 'Warkop Berkah', 'ip' => '192.168.1.102', 'dl' => 950.3,  'ul' => 200.7],
        ];

        $sessions = [];
        foreach ($demoUsers as $u) {
            $total = $u['dl'] + $u['ul'];
            $sessions[] = [
                'username'    => $u['username'],
                'ip_address'  => $u['ip'],
                'is_online'   => true,
                'download_mb' => $u['dl'],
                'upload_mb'   => $u['ul'],
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
            $hasOverdueInvoice = Invoice::where('customer_id', $cust->id)
                ->where('status', 'unpaid')
                ->where('due_date', '<', now())
                ->exists();

            $result[$cust->id] = [
                'billing_status' => $cust->status,
                'is_isolir'      => $cust->status === 'terisolir',
                'is_nonaktif'    => $cust->status === 'nonaktif',
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
                'ticket_id' => $t->id,
                'title'     => $t->title,
                'priority'  => $t->priority,
                'status'    => $t->status,
            ];
        }
        return $result;
    }

    // ─── ODP CAPACITY ─────────────────────────────────────────────────────────

    private function getOdpCapacity($nodes, $edges)
    {
        $odpNodes = $nodes->where('type', 'odp');
        $result   = [];

        foreach ($odpNodes as $odp) {
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

        $allNodes = $nodes->keyBy('id');
        $visited  = [];
        $queue    = $offlineParents;

        while (!empty($queue)) {
            $currentId = array_shift($queue);
            if (in_array($currentId, $visited)) continue;
            $visited[] = $currentId;

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
}
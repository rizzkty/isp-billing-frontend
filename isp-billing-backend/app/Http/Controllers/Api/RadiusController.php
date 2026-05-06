<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class RadiusController extends Controller
{
    public function testDbConnection(Request $request)
    {
        // Validasi input dari React
        $request->validate([
            'dbHost' => 'required',
            'dbPort' => 'required',
            'dbUser' => 'required',
            'dbName' => 'required',
        ]);

        try {
            // Merakit DSN untuk PDO
            $dsn = "mysql:host={$request->dbHost};port={$request->dbPort};dbname={$request->dbName};charset=utf8mb4";
            
            // Set opsi timeout agar tidak hang jika IP salah
            $options = [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_TIMEOUT => 5 
            ];
            
            // Mencoba membuat koneksi
            $pdo = new \PDO($dsn, $request->dbUser, $request->dbPass, $options);
            
            // Jika berhasil
            return response()->json([
                'success' => true, 
                'message' => 'Koneksi ke Database RADIUS Berhasil!'
            ], 200);
            
        } catch (\PDOException $e) {
            // Jika gagal
            return response()->json([
                'success' => false, 
                'message' => 'Koneksi Gagal: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getActiveSessions(Request $request)
    {
        $settings = \App\Models\Setting::whereIn('key', ['dbHost', 'dbPort', 'dbUser', 'dbPass', 'dbName'])
                           ->pluck('value', 'key');
        
        $dbHost = $settings->get('dbHost');
        $dbPort = $settings->get('dbPort', '3306');
        $dbUser = $settings->get('dbUser');
        $dbName = $settings->get('dbName', 'radius');

        $dbPassRaw = $settings->get('dbPass', '');
        try {
            $dbPass = !empty($dbPassRaw) ? \Illuminate\Support\Facades\Crypt::decryptString($dbPassRaw) : '';
        } catch (\Exception $e) {
            $dbPass = $dbPassRaw;
        }

        $isDemo = empty($dbHost) || empty($dbUser);

        if (!$isDemo) {
            try {
                $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
                $options = [
                    \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                    \PDO::ATTR_TIMEOUT => 3 
                ];
                $pdo = new \PDO($dsn, $dbUser, $dbPass, $options);

                $stmt = $pdo->query("SELECT username, nasipaddress, framedipaddress, callingstationid, acctstarttime, acctsessiontime, acctinputoctets, acctoutputoctets FROM radacct WHERE acctstoptime IS NULL ORDER BY acctstarttime DESC");
                $sessions = $stmt->fetchAll(\PDO::FETCH_ASSOC);

                // Format untuk frontend
                $formattedSessions = array_map(function($s) {
                    return [
                        'username' => $s['username'],
                        'nas_ip' => $s['nasipaddress'],
                        'ip_address' => $s['framedipaddress'],
                        'mac_address' => $s['callingstationid'],
                        'start_time' => $s['acctstarttime'],
                        'uptime' => gmdate("H:i:s", $s['acctsessiontime']),
                        'download' => round($s['acctoutputoctets'] / 1048576, 2), // MB
                        'upload' => round($s['acctinputoctets'] / 1048576, 2) // MB
                    ];
                }, $sessions);

                $totalDownload = array_sum(array_column($formattedSessions, 'download'));
                $totalUpload = array_sum(array_column($formattedSessions, 'upload'));

                return response()->json([
                    'success' => true,
                    'is_demo' => false,
                    'data' => [
                        'total_users' => count($formattedSessions),
                        'total_traffic' => round($totalDownload + $totalUpload, 2),
                        'sessions' => $formattedSessions
                    ]
                ], 200);

            } catch (\Exception $e) {
                // Fallback ke demo
                $isDemo = true;
            }
        }

        if ($isDemo) {
            return response()->json($this->getDemoSessions(), 200);
        }
    }

    private function getDemoSessions()
    {
        // Dynamic demo data
        $users = [
            ['Siti Aminah', '192.168.1.11', 'E5:F6:A7:B8'],
            ['Budi Santoso', '192.168.1.25', 'A1:B2:C3:D4'],
            ['PT. Maju Jaya', '192.168.1.40', 'F1:E2:D3:C4'],
            ['Rina Dewi', '192.168.1.62', '11:22:33:44'],
            ['Ahmad Wijaya', '192.168.1.75', 'AA:BB:CC:DD'],
            ['Dedi Corbuzier', '192.168.1.80', 'EE:FF:00:11'],
            ['Warkop Berkah', '192.168.1.102', '22:33:44:55'],
        ];

        $sessions = [];
        $totalDownload = 0;
        $totalUpload = 0;

        foreach ($users as $i => $u) {
            // Simulasi traffic & uptime bertambah
            $baseDl = 1500 + ($i * 450); // MB
            $baseUl = 300 + ($i * 120); // MB
            $dl = $baseDl + rand(1, 50) + (rand(1,10)/10);
            $ul = $baseUl + rand(1, 20) + (rand(1,10)/10);
            
            $uptimeSeconds = 36000 + ($i * 7200) + (time() % 3600); // Simulasi uptime naik terus
            
            $sessions[] = [
                'username' => $u[0],
                'nas_ip' => '10.10.10.1',
                'ip_address' => $u[1],
                'mac_address' => $u[2],
                'start_time' => date('Y-m-d H:i:s', time() - $uptimeSeconds),
                'uptime' => floor($uptimeSeconds / 3600) . "h " . floor(($uptimeSeconds % 3600) / 60) . "m " . ($uptimeSeconds % 60) . "s",
                'download' => round($dl, 2),
                'upload' => round($ul, 2)
            ];

            $totalDownload += $dl;
            $totalUpload += $ul;
        }

        return [
            'success' => true,
            'is_demo' => true,
            'data' => [
                'total_users' => count($sessions),
                'total_traffic' => round($totalDownload + $totalUpload, 2),
                'sessions' => $sessions
            ]
        ];
    }
}
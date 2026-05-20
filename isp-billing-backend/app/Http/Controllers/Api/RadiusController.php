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

        if (empty($dbHost) || empty($dbUser)) {
            return response()->json([
                'success' => false,
                'message' => 'Database RADIUS belum dikonfigurasi.'
            ], 400);
        }

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
                return response()->json([
                    'success' => false,
                    'message' => 'Koneksi Gagal: ' . $e->getMessage()
                ], 500);
            }
    }
}
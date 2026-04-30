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
}
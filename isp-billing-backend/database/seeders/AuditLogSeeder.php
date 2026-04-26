<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AuditLog;
use App\Models\User;

class AuditLogSeeder extends Seeder
{
    public function run(): void
    {
        $admin   = User::where('role', 'admin')->first();
        $teknisi = User::where('role', 'teknisi')->first();
        $pemilik = User::where('role', 'pemilik')->first();

        $logs = [
            ['user_id' => $pemilik?->id, 'action' => 'LOGIN',             'detail' => 'Login berhasil (pemilik)',                    'ip_address' => '114.120.45.12'],
            ['user_id' => $admin?->id,   'action' => 'CREATE_CUSTOMER',   'detail' => 'Menambah pelanggan: Budi Santoso',            'ip_address' => '192.168.1.10'],
            ['user_id' => $admin?->id,   'action' => 'CREATE_CUSTOMER',   'detail' => 'Menambah pelanggan: Siti Aminah',             'ip_address' => '192.168.1.10'],
            ['user_id' => $admin?->id,   'action' => 'GENERATE_INVOICE',  'detail' => 'Generate 3 tagihan periode 4/2026',           'ip_address' => '192.168.1.10'],
            ['user_id' => $admin?->id,   'action' => 'PAYMENT_VERIFIED',  'detail' => 'Verifikasi pembayaran tagihan #1',            'ip_address' => '192.168.1.10'],
            ['user_id' => $teknisi?->id, 'action' => 'UPDATE_TICKET',     'detail' => 'Mengubah status tiket "Internet Mati" → In Progress', 'ip_address' => '10.0.0.5'],
            ['user_id' => $admin?->id,   'action' => 'CREATE_USER',       'detail' => 'Membuat akun teknisi: Budi Teknisi',          'ip_address' => '192.168.1.10'],
            ['user_id' => $pemilik?->id, 'action' => 'VIEW_REPORT',       'detail' => 'Membuka halaman Laporan Keuangan',            'ip_address' => '114.120.45.12'],
            ['user_id' => $admin?->id,   'action' => 'SEND_NOTIFICATION', 'detail' => 'Broadcast: Pemeliharaan Jaringan Malam Ini',  'ip_address' => '192.168.1.10'],
            ['user_id' => $teknisi?->id, 'action' => 'LOGIN',             'detail' => 'Login berhasil (teknisi)',                    'ip_address' => '10.0.0.5'],
            ['user_id' => $pemilik?->id, 'action' => 'LOGOUT',            'detail' => 'Logout dari sistem',                         'ip_address' => '114.120.45.12'],
            ['user_id' => $admin?->id,   'action' => 'DELETE_CUSTOMER',   'detail' => 'Menghapus pelanggan: Andi Susanto',           'ip_address' => '192.168.1.10'],
        ];

        foreach ($logs as $i => $log) {
            $log['created_at'] = now()->subMinutes(count($logs) - $i)->subHours(rand(0, 48));
            $log['updated_at'] = $log['created_at'];
            AuditLog::create($log);
        }

        $this->command->info('✅ 12 data Audit Log dummy berhasil diisi.');
    }
}

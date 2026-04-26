<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ticket;
use App\Models\Notification;
use App\Models\User;
use App\Models\Customer;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        $teknisi = User::where('role', 'teknisi')->first();
        $customers = Customer::take(3)->get();

        // ── TICKETS ───────────────────────────────────────────────
        $tickets = [
            [
                'title'       => 'Internet Mati Total',
                'description' => 'Pelanggan melaporkan koneksi internet terputus sejak pagi hari. Tidak ada lampu LAN yang menyala di modem.',
                'priority'    => 'urgent',
                'status'      => 'open',
                'customer_id' => $customers->get(0)?->id,
                'assigned_to' => $teknisi?->id,
            ],
            [
                'title'       => 'Koneksi Lambat - Netflix Buffering',
                'description' => 'Speed download turun drastis dari 20 Mbps ke 1 Mbps. Sudah coba restart modem tapi tidak membantu.',
                'priority'    => 'high',
                'status'      => 'in_progress',
                'customer_id' => $customers->get(1)?->id,
                'assigned_to' => $teknisi?->id,
            ],
            [
                'title'       => 'Minta Upgrade Paket',
                'description' => 'Pelanggan ingin upgrade dari paket 10 Mbps ke 20 Mbps. Mohon diproses secepatnya.',
                'priority'    => 'medium',
                'status'      => 'resolved',
                'customer_id' => $customers->get(2)?->id,
                'assigned_to' => $admin?->id,
                'resolution'  => 'Paket sudah berhasil di-upgrade. Pelanggan dikonfirmasi.',
            ],
            [
                'title'       => 'Router Fisik Rusak',
                'description' => 'Router milik pelanggan jatuh dan tidak bisa dinyalakan. Perlu penggantian perangkat.',
                'priority'    => 'high',
                'status'      => 'open',
                'customer_id' => $customers->get(0)?->id,
                'assigned_to' => $teknisi?->id,
            ],
            [
                'title'       => 'Gangguan Jaringan Area Selatan',
                'description' => 'Dilaporkan oleh beberapa pelanggan di area Jl. Selatan bahwa jaringan tidak stabil sejak kemarin malam.',
                'priority'    => 'urgent',
                'status'      => 'in_progress',
                'customer_id' => null,
                'assigned_to' => $teknisi?->id,
            ],
        ];

        foreach ($tickets as $t) {
            Ticket::create($t);
        }

        // ── NOTIFICATIONS ─────────────────────────────────────────
        $notifs = [
            [
                'title'           => 'Pemeliharaan Jaringan Malam Ini',
                'message'         => 'Kami akan melakukan pemeliharaan jaringan pada pukul 23.00 - 01.00 WIB. Mohon maaf atas ketidaknyamanannya.',
                'type'            => 'broadcast',
                'sent_by'         => $admin?->id,
                'recipient_count' => Customer::where('status', 'aktif')->count(),
            ],
            [
                'title'           => 'Tagihan Bulan April Sudah Terbit',
                'message'         => 'Tagihan bulan April telah diterbitkan. Silakan lakukan pembayaran sebelum tanggal 10 untuk menghindari pemutusan layanan.',
                'type'            => 'broadcast',
                'sent_by'         => $admin?->id,
                'recipient_count' => Customer::where('status', 'aktif')->count(),
            ],
            [
                'title'           => 'Promo Upgrade Paket',
                'message'         => 'Dapatkan promo upgrade paket internet dengan harga spesial! Upgrade ke 50 Mbps hanya tambah Rp 50.000/bulan. Hubungi kami sekarang!',
                'type'            => 'broadcast',
                'sent_by'         => $admin?->id,
                'recipient_count' => Customer::where('status', 'aktif')->count(),
            ],
        ];

        foreach ($notifs as $n) {
            Notification::create($n);
        }

        // ── TAMBAHAN USER (Teknisi) ────────────────────────────────
        if (!User::where('username', 'teknisi1')->exists()) {
            User::create([
                'name'     => 'Budi Teknisi',
                'username' => 'teknisi1',
                'password' => bcrypt('password'),
                'role'     => 'teknisi',
            ]);
        }

        $this->command->info('✅ Data dummy berhasil diisi: Tiket, Notifikasi, dan User Teknisi.');
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('notification_templates')->insert([
            'name'       => 'Tagihan Pembayaran Manual',
            'title'      => 'Pemberitahuan Tagihan Pembayaran Manual',
            'message'    => "Yth. {{nama}},\n\nTagihan internet Anda untuk paket *{{paket}}* senilai *{{nominal}}* telah jatuh tempo.\n\nSilakan lakukan pembayaran secara manual transfer ke rekening berikut:\n🏦 *Bank Mandiri*: 123-456-789-0 (a.n. NetBilling ISP)\n🏦 *Bank BCA*: 987-654-321-0 (a.n. NetBilling ISP)\n\nSetelah melakukan transfer, mohon unggah bukti bayar Anda melalui portal pelanggan:\n👉 {{link_portal}}\n\nTerima kasih atas kerja samanya.\n_Tim ISP NetBilling_",
            'is_default' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('notification_templates')->where('name', 'Tagihan Pembayaran Manual')->delete();
    }
};

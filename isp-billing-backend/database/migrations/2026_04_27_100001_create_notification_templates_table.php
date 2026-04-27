<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notification_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('title');
            $table->text('message');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        // Seed 5 default templates
        DB::table('notification_templates')->insert([
            [
                'name'       => 'Tagihan Jatuh Tempo',
                'title'      => 'Pengingat Tagihan Internet',
                'message'    => "Yth. {{nama}},\n\nTagihan internet Anda untuk paket *{{paket}}* senilai *{{nominal}}* akan jatuh tempo pada *{{jatuh_tempo}}*.\n\nMohon segera lakukan pembayaran agar koneksi Anda tetap aktif.\n\nTerima kasih 🙏\n_Tim ISP NetBilling_",
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name'       => 'Selamat Bergabung',
                'title'      => 'Selamat Datang di NetBilling ISP!',
                'message'    => "Halo {{nama}}! 👋\n\nSelamat datang! Akun internet Anda dengan paket *{{paket}}* telah aktif.\n\nJika ada kendala, jangan ragu untuk menghubungi kami. Nikmati koneksi cepat bersama kami!\n\nSalam hangat,\n_Tim ISP NetBilling_",
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name'       => 'Gangguan Jaringan',
                'title'      => 'Pemberitahuan Gangguan Jaringan',
                'message'    => "Yth. Pelanggan,\n\nKami menginformasikan bahwa saat ini terjadi gangguan jaringan di area Anda.\n\nTim teknis kami sedang bekerja untuk memulihkan layanan secepatnya. Kami mohon maaf atas ketidaknyamanan ini.\n\nEstimasi pemulihan: *{{jatuh_tempo}}*\n\nTerima kasih atas kesabaran Anda 🙏\n_Tim ISP NetBilling_",
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name'       => 'Peringatan Isolir',
                'title'      => 'Peringatan: Layanan Akan Diisolir',
                'message'    => "Yth. {{nama}},\n\nKami memberitahukan bahwa layanan internet Anda *akan diisolir* karena tagihan senilai *{{nominal}}* belum dibayar hingga *{{jatuh_tempo}}*.\n\nSegera lakukan pembayaran untuk menghindari pemutusan layanan.\n\nHubungi kami jika ada pertanyaan.\n_Tim ISP NetBilling_",
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name'       => 'Promo Upgrade Paket',
                'title'      => 'Penawaran Spesial: Upgrade Paket Internet!',
                'message'    => "Halo {{nama}}! 🎉\n\nKami punya penawaran spesial untuk Anda!\n\nUpgrade dari paket *{{paket}}* ke paket yang lebih tinggi dan nikmati kecepatan internet yang lebih kencang dengan harga spesial.\n\nHubungi kami sekarang untuk informasi lebih lanjut!\n\n_Tim ISP NetBilling_",
                'is_default' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_templates');
    }
};

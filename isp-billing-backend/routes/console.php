<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

// Jadwalkan auto-isolir berjalan setiap hari jam 00:01
Schedule::command('isp:isolir')->dailyAt('00:01');

// Jadwalkan auto-unblock berjalan setiap 15 menit agar pelanggan yang bayar cepat aktif kembali
Schedule::command('isp:unblock')->everyFifteenMinutes();

// Jadwalkan pengingat tagihan otomatis berjalan setiap hari jam 08:00 pagi
Schedule::command('isp:billing-reminders')->dailyAt('08:00');

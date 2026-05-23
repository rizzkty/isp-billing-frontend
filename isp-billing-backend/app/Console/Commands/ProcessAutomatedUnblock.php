<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Support\Facades\Log;
use App\Jobs\SendWhatsAppJob;
use App\Jobs\MikroTikActionJob;

class ProcessAutomatedUnblock extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'isp:unblock';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Proses otomatis buka isolir untuk pelanggan yang sudah lunas.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Memulai proses otomatis buka isolir...");

        $customersToUnblock = Customer::where('status', 'terisolir')
            ->whereDoesntHave('invoices', function ($query) {
                $query->where('status', '!=', 'paid');
            })
            ->get();

        if ($customersToUnblock->isEmpty()) {
            $this->info("Tidak ada pelanggan yang perlu dibuka isolirnya.");
            return Command::SUCCESS;
        }

        $unblockedCount = 0;

        foreach ($customersToUnblock as $customer) {
            // Update DB Status
            $customer->status = 'aktif';
            $customer->save();

            // Dispatch MikroTik Job (Background)
            MikroTikActionJob::dispatch('remove', $customer->ip_address, $customer->name);

            // Dispatch WhatsApp Job (Background)
            if ($customer->phone) {
                $msg = "✅ *LAYANAN AKTIF KEMBALI*\n\n" .
                       "Yth. Bapak/Ibu *{$customer->name}*,\n" .
                       "Terima kasih atas pembayarannya. Layanan internet Anda telah diaktifkan kembali secara otomatis.\n\n" .
                       "Selamat menikmati kembali layanan kami.";
                SendWhatsAppJob::dispatch($customer->phone, $msg);
            }

            $unblockedCount++;
        }

        $this->info("Proses selesai. $unblockedCount pelanggan dikirim ke antrean buka isolir.");
        Log::info("Auto-Unblock: Berhasil memproses $unblockedCount pelanggan ke background queue.");

        return Command::SUCCESS;
    }
}

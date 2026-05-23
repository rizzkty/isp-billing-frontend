<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Invoice;
use App\Models\Customer;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use App\Jobs\SendWhatsAppJob;
use App\Jobs\MikroTikActionJob;

class ProcessAutomatedIsolir extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'isp:isolir';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Proses otomatis isolir untuk pelanggan yang menunggak.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Memulai proses otomatis isolir...");
        
        $overdueInvoices = Invoice::with('customer')
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now()->toDateString())
            ->get();

        if ($overdueInvoices->isEmpty()) {
            $this->info("Tidak ada pelanggan yang perlu diisolir.");
            return Command::SUCCESS;
        }

        $isolatedCount = 0;

        foreach ($overdueInvoices as $invoice) {
            $customer = $invoice->customer;

            if ($customer && $customer->status !== 'terisolir') {
                // Update DB Status
                $customer->status = 'terisolir';
                $customer->save();

                // Dispatch MikroTik Job (Background)
                MikroTikActionJob::dispatch('add', $customer->ip_address, $customer->name);

                // Dispatch WhatsApp Job (Background)
                if ($customer->phone) {
                    $msg = "📢 *PEMBERITAHUAN ISOLIR*\n\n" .
                           "Yth. Bapak/Ibu *{$customer->name}*,\n" .
                           "Kami menginformasikan bahwa layanan internet Anda saat ini dinonaktifkan (Isolir) dikarenakan tagihan yang sudah melewati jatuh tempo.\n\n" .
                           "Silakan segera lakukan pembayaran untuk mengaktifkan kembali layanan secara otomatis.\n" .
                           "Terima kasih.";
                    SendWhatsAppJob::dispatch($customer->phone, $msg);
                }

                $isolatedCount++;
            }
        }

        $this->info("Proses selesai. $isolatedCount pelanggan dikirim ke antrean isolir.");
        Log::info("Auto-Isolir: Berhasil memproses $isolatedCount pelanggan ke background queue.");

        return Command::SUCCESS;
    }
}

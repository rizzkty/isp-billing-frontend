<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Invoice;
use App\Models\Customer;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use RouterOS\Client;
use RouterOS\Query;

class ProcessAutomatedIsolir extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'isp:isolir {--manual : Run manual mode without checking schedule}';

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
        Log::info("Auto-Isolir: Memulai proses pengecekan tagihan jatuh tempo.");

        // Cari invoice yang statusnya belum lunas (unpaid) dan sudah melewati due_date
        // Catatan: due_date di database formatnya date/datetime
        $overdueInvoices = Invoice::with('customer')
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now()->toDateString())
            ->get();

        if ($overdueInvoices->isEmpty()) {
            $this->info("Tidak ada pelanggan yang perlu diisolir saat ini.");
            Log::info("Auto-Isolir: Tidak ada invoice jatuh tempo ditemukan.");
            return Command::SUCCESS;
        }

        $this->info("Ditemukan {$overdueInvoices->count()} tagihan jatuh tempo.");

        // Ambil pengaturan MikroTik
        $settings = Setting::whereIn('key', ['apiIp', 'apiPort', 'apiUser', 'apiPass'])
                           ->pluck('value', 'key');
                           
        $apiIp   = $settings->get('apiIp');
        $apiPort = $settings->get('apiPort', '8728');
        $apiUser = $settings->get('apiUser');
        $apiPass = $settings->get('apiPass', '');

        $client = null;
        $isDemo = empty($apiIp) || empty($apiUser);

        if (!$isDemo) {
            try {
                $client = new Client([
                    'host'    => $apiIp,
                    'user'    => $apiUser,
                    'pass'    => $apiPass,
                    'port'    => (int) $apiPort,
                    'timeout' => 5,
                ]);
                $this->info("Berhasil terhubung ke MikroTik API.");
            } catch (\Exception $e) {
                $this->error("Gagal terhubung ke MikroTik: " . $e->getMessage());
                Log::error("Auto-Isolir: Gagal terhubung ke MikroTik: " . $e->getMessage());
                $isDemo = true;
            }
        } else {
            $this->warn("Kredensial MikroTik belum lengkap. Menjalankan dalam Mode DEMO.");
        }

        $isolatedCount = 0;

        foreach ($overdueInvoices as $invoice) {
            $customer = $invoice->customer;

            if (!$customer) {
                continue;
            }

            // Jika pelanggan belum diisolir
            if ($customer->status !== 'isolir') {
                $customer->status = 'isolir';
                $customer->save();

                $this->info("Mengubah status DB pelanggan {$customer->name} (ID: {$customer->id}) menjadi isolir.");
                
                // Eksekusi ke MikroTik (Masukkan IP ke Address List 'ISOLIR_LIST')
                if (!$isDemo && $client && $customer->ip_address) {
                    try {
                        // Cek apakah sudah ada di address list
                        $query = (new Query('/ip/firewall/address-list/print'))
                                    ->where('address', $customer->ip_address)
                                    ->where('list', 'ISOLIR_LIST');
                        
                        $existing = $client->query($query)->read();

                        if (empty($existing)) {
                            // Tambahkan ke address list
                            $addQuery = (new Query('/ip/firewall/address-list/add'))
                                            ->equal('address', $customer->ip_address)
                                            ->equal('list', 'ISOLIR_LIST')
                                            ->equal('comment', 'Auto-Isolir: ' . $customer->name);
                            $client->query($addQuery)->read();
                            $this->info("Berhasil menambahkan IP {$customer->ip_address} ke ISOLIR_LIST di MikroTik.");
                            Log::info("Auto-Isolir: IP {$customer->ip_address} ({$customer->name}) ditambahkan ke ISOLIR_LIST.");
                        } else {
                            $this->info("IP {$customer->ip_address} sudah ada di ISOLIR_LIST.");
                        }
                    } catch (\Exception $e) {
                        $this->error("Gagal isolir MikroTik untuk {$customer->name}: " . $e->getMessage());
                        Log::error("Auto-Isolir: Gagal update MikroTik untuk {$customer->name}: " . $e->getMessage());
                    }
                } elseif ($isDemo) {
                    Log::info("[DEMO] Auto-Isolir: Mengisolasi IP {$customer->ip_address} ({$customer->name}) ke ISOLIR_LIST.");
                }

                $isolatedCount++;
            }
        }

        $this->info("Proses selesai. Total $isolatedCount pelanggan berhasil diisolir.");
        Log::info("Auto-Isolir: Selesai. Total $isolatedCount pelanggan diisolir.");

        return Command::SUCCESS;
    }
}

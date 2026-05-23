<?php

namespace App\Observers;

use App\Models\Invoice;
use App\Jobs\SendWhatsAppJob;
use App\Jobs\SendEmailJob;
use App\Models\CustomerToken;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class InvoiceObserver
{
    /**
     * Handle the Invoice "created" event.
     */
    public function created(Invoice $invoice): void
    {
        $customer = $invoice->customer;
        if ($customer) {
            // Generate Magic Link Token (berlaku 30 hari untuk tagihan baru)
            $rawToken = Str::random(48);
            CustomerToken::create([
                'customer_id' => $customer->id,
                'token'       => $rawToken,
                'type'        => 'magic_link',
                'expires_at'  => now()->addDays(30),
            ]);

            $magicLink = env('APP_FRONTEND_URL', 'http://localhost:5173')
                       . "/portal/verify?token={$rawToken}&redirect=/portal/invoices";

            // Notifikasi WhatsApp
            if ($customer->phone) {
                $msg = "🧾 *TAGIHAN BARU TERBIT*\n\n" .
                       "Yth. Bapak/Ibu *{$customer->name}*,\n" .
                       "Tagihan internet Anda untuk periode ini telah diterbitkan.\n\n" .
                       "No. Invoice: #{$invoice->invoice_number}\n" .
                       "Jumlah: Rp " . number_format($invoice->amount, 0, ',', '.') . "\n" .
                       "Jatuh Tempo: " . date('d M Y', strtotime($invoice->due_date)) . "\n\n" .
                       "Klik link berikut untuk masuk ke portal dan membayar tagihan Anda:\n" .
                       "👉 {$magicLink}\n\n" .
                       "Terima kasih.";
                
                SendWhatsAppJob::dispatch($customer->phone, $msg);
            }

            // Notifikasi Email
            if ($customer->email) {
                $emailSubject = "Tagihan Baru Terbit #{$invoice->invoice_number} - NetBilling ISP";
                $emailBody = "Yth. Bapak/ Ibu {$customer->name},\n\n" .
                             "Tagihan internet Anda untuk periode ini telah diterbitkan.\n\n" .
                             "No. Invoice: #{$invoice->invoice_number}\n" .
                             "Jumlah Tagihan: Rp " . number_format($invoice->amount, 0, ',', '.') . "\n" .
                             "Jatuh Tempo: " . date('d M Y', strtotime($invoice->due_date)) . "\n\n" .
                             "Klik link berikut untuk masuk ke portal pelanggan dan melakukan pembayaran secara online:\n" .
                             "👉 {$magicLink}\n\n" .
                             "Silakan lakukan pembayaran sebelum tanggal jatuh tempo. Jika ada pertanyaan, jangan ragu untuk menghubungi layanan bantuan kami.\n\n" .
                             "Terima kasih,\n" .
                             "NetBilling ISP";

                SendEmailJob::dispatch($customer->email, $emailSubject, $emailBody, $customer);
            }
        }
    }

    /**
     * Handle the Invoice "updated" event.
     */
    public function updated(Invoice $invoice): void
    {
        // Jika status berubah menjadi 'paid'
        if ($invoice->isDirty('status') && $invoice->status === 'paid') {
            $customer = $invoice->customer;
            if ($customer) {
                // Generate Magic Link Token (berlaku 7 hari untuk melihat riwayat pembayaran)
                $rawToken = Str::random(48);
                CustomerToken::create([
                    'customer_id' => $customer->id,
                    'token'       => $rawToken,
                    'type'        => 'magic_link',
                    'expires_at'  => now()->addDays(7),
                ]);

                $magicLink = env('APP_FRONTEND_URL', 'http://localhost:5173')
                           . "/portal/verify?token={$rawToken}&redirect=/portal/invoices";

                // Notifikasi WhatsApp
                if ($customer->phone) {
                    $msg = "🙏 *TERIMA KASIH ATAS PEMBAYARAN ANDA*\n\n" .
                           "Yth. Bapak/Ibu *{$customer->name}*,\n" .
                           "Pembayaran untuk Invoice #{$invoice->invoice_number} sebesar Rp " . number_format($invoice->amount, 0, ',', '.') . " telah kami terima.\n\n" .
                           "Status: *LUNAS*\n\n" .
                           "Anda dapat melihat riwayat pembayaran & mengunduh kuitansi resmi di portal pelanggan:\n" .
                           "👉 {$magicLink}\n\n" .
                           "Terima kasih telah berlangganan bersama kami.";
                    
                    SendWhatsAppJob::dispatch($customer->phone, $msg);
                }

                // Notifikasi Email
                if ($customer->email) {
                    $emailSubject = "Pembayaran Invoice Lunas #{$invoice->invoice_number} - NetBilling ISP";
                    $emailBody = "Yth. Bapak/ Ibu {$customer->name},\n\n" .
                                 "Terima kasih atas pembayaran Anda. Pembayaran untuk Invoice #{$invoice->invoice_number} sebesar Rp " . number_format($invoice->amount, 0, ',', '.') . " telah kami terima dengan status LUNAS.\n\n" .
                                 "Anda dapat melihat riwayat tagihan dan mengunduh kuitansi pembayaran resmi Anda langsung melalui portal pelanggan:\n" .
                                 "👉 {$magicLink}\n\n" .
                                 "Terima kasih telah memercayakan layanan internet Anda kepada NetBilling ISP.\n\n" .
                                 "Salam hangat,\n" .
                                 "NetBilling ISP";

                    SendEmailJob::dispatch($customer->email, $emailSubject, $emailBody, $customer);
                }
            }
        }
    }
}

<?php

namespace App\Observers;

use App\Models\Invoice;
use App\Jobs\SendWhatsAppJob;
use Illuminate\Support\Facades\Log;

class InvoiceObserver
{
    /**
     * Handle the Invoice "created" event.
     */
    public function created(Invoice $invoice): void
    {
        $customer = $invoice->customer;
        if ($customer && $customer->phone) {
            $msg = "🧾 *TAGIHAN BARU TERBIT*\n\n" .
                   "Yth. Bapak/Ibu *{$customer->name}*,\n" .
                   "Tagihan internet Anda untuk periode ini telah diterbitkan.\n\n" .
                   "No. Invoice: #{$invoice->invoice_number}\n" .
                   "Jumlah: Rp " . number_format($invoice->amount, 0, ',', '.') . "\n" .
                   "Jatuh Tempo: " . date('d M Y', strtotime($invoice->due_date)) . "\n\n" .
                   "Silakan lakukan pembayaran sebelum tanggal jatuh tempo. Terima kasih.";
            
            SendWhatsAppJob::dispatch($customer->phone, $msg);
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
            if ($customer && $customer->phone) {
                $msg = "🙏 *TERIMA KASIH ATAS PEMBAYARAN ANDA*\n\n" .
                       "Yth. Bapak/Ibu *{$customer->name}*,\n" .
                       "Pembayaran untuk Invoice #{$invoice->invoice_number} sebesar Rp " . number_format($invoice->amount, 0, ',', '.') . " telah kami terima.\n\n" .
                       "Status: *LUNAS*\n" .
                       "Terima kasih telah berlangganan bersama kami.";
                
                SendWhatsAppJob::dispatch($customer->phone, $msg);
            }
        }
    }
}

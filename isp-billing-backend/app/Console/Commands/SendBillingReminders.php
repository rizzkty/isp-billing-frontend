<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Invoice;
use App\Models\CustomerToken;
use App\Jobs\SendWhatsAppJob;
use App\Jobs\SendEmailJob;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class SendBillingReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'isp:billing-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim pengingat tagihan otomatis (H-3, Hari H, dan H+1 keterlambatan) via WA dan Email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::today();
        $this->info("Menjalankan pengingat tagihan harian pada: " . $today->toDateString());

        // 1. Pengingat H-3 Sebelum Jatuh Tempo
        $h3Date = $today->copy()->addDays(3)->toDateString();
        $this->processReminders($h3Date, 'h-3');

        // 2. Pengingat Hari H Jatuh Tempo
        $hariHDate = $today->toDateString();
        $this->processReminders($hariHDate, 'hari-h');

        // 3. Peringatan H+1 Keterlambatan
        $hPlus1Date = $today->copy()->subDays(1)->toDateString();
        $this->processReminders($hPlus1Date, 'h+1');

        $this->info("Pengingat tagihan selesai diproses.");
    }

    /**
     * Cari invoice belum lunas dan kirim pengingat berdasarkan tipe
     */
    protected function processReminders($dueDate, $type)
    {
        $invoices = Invoice::where('due_date', $dueDate)
            ->where('status', 'unpaid')
            ->with('customer')
            ->get();

        $this->info("Memproses tipe [{$type}] untuk tanggal jatuh tempo {$dueDate}. Jumlah tagihan: " . $invoices->count());

        foreach ($invoices as $invoice) {
            $customer = $invoice->customer;
            if (!$customer || $customer->status !== 'aktif') {
                continue;
            }

            // Generate Magic Link (berlaku 30 hari)
            $rawToken = Str::random(48);
            CustomerToken::create([
                'customer_id' => $customer->id,
                'token'       => $rawToken,
                'type'        => 'magic_link',
                'expires_at'  => now()->addDays(30),
            ]);

            $magicLink = env('APP_FRONTEND_URL', 'http://localhost:5173')
                       . "/portal/verify?token={$rawToken}&redirect=/portal/invoices";

            $amountFormatted = "Rp " . number_format($invoice->amount, 0, ',', '.');
            $dueDateFormatted = date('d M Y', strtotime($invoice->due_date));

            // Tentukan pesan berdasarkan tipe pengingat
            $waMessage = '';
            $emailSubject = '';
            $emailBody = '';

            if ($type === 'h-3') {
                $waMessage = "⏰ *PENGINGAT TAGIHAN INTERNET (H-3)*\n\n" .
                             "Yth. Bapak/Ibu *{$customer->name}*,\n" .
                             "Mengingatkan bahwa tagihan internet Anda akan jatuh tempo dalam 3 hari lagi.\n\n" .
                             "No. Invoice: #{$invoice->invoice_number}\n" .
                             "Jumlah: {$amountFormatted}\n" .
                             "Jatuh Tempo: {$dueDateFormatted}\n\n" .
                             "Silakan lakukan pembayaran agar layanan tetap aktif tanpa kendala:\n" .
                             "👉 {$magicLink}\n\n" .
                             "Terima kasih atas kerja samanya.";

                $emailSubject = "⏰ Pengingat Tagihan Internet (H-3) - #{$invoice->invoice_number}";
                $emailBody = "Yth. Bapak/ Ibu {$customer->name},\n\n" .
                             "Kami menginformasikan bahwa tagihan layanan internet Anda sebesar {$amountFormatted} akan jatuh tempo pada {$dueDateFormatted} (3 hari lagi).\n\n" .
                             "No. Invoice: #{$invoice->invoice_number}\n\n" .
                             "Untuk melakukan pembayaran secara online, silakan klik tautan portal berikut:\n" .
                             "👉 {$magicLink}\n\n" .
                             "Harap lakukan pembayaran sebelum tanggal jatuh tempo agar kenyamanan internet Anda tidak terganggu.\n\n" .
                             "Salam hangat,\n" .
                             "NetBilling ISP";
            } elseif ($type === 'hari-h') {
                $waMessage = "⚠️ *TAGIHAN JATUH TEMPO HARI INI*\n\n" .
                             "Yth. Bapak/Ibu *{$customer->name}*,\n" .
                             "Tagihan internet Anda jatuh tempo pada hari ini, {$dueDateFormatted}.\n\n" .
                             "No. Invoice: #{$invoice->invoice_number}\n" .
                             "Jumlah: {$amountFormatted}\n\n" .
                             "Harap segera melakukan pembayaran via portal kami untuk menghindari pemutusan otomatis:\n" .
                             "👉 {$magicLink}\n\n" .
                             "Terima kasih.";

                $emailSubject = "⚠️ Tagihan Jatuh Tempo Hari Ini - #{$invoice->invoice_number}";
                $emailBody = "Yth. Bapak/ Ibu {$customer->name},\n\n" .
                             "Pemberitahuan bahwa tagihan internet Anda sebesar {$amountFormatted} jatuh tempo pada hari ini, {$dueDateFormatted}.\n\n" .
                             "No. Invoice: #{$invoice->invoice_number}\n\n" .
                             "Silakan klik link di bawah untuk masuk ke portal dan membayar tagihan secara instan:\n" .
                             "👉 {$magicLink}\n\n" .
                             "Jika pembayaran tidak diterima hari ini, sistem akan melakukan pemblokiran layanan secara otomatis pada esok hari.\n\n" .
                             "Terima kasih,\n" .
                             "NetBilling ISP";
            } elseif ($type === 'h+1') {
                $waMessage = "🚨 *PERINGATAN KETERLAMBATAN & ISOLIR*\n\n" .
                             "Yth. Bapak/Ibu *{$customer->name}*,\n" .
                             "Tagihan internet Anda telah melewati tanggal jatuh tempo ({$dueDateFormatted}) dan saat ini berstatus *Terlambat*.\n\n" .
                             "No. Invoice: #{$invoice->invoice_number}\n" .
                             "Jumlah: {$amountFormatted}\n\n" .
                             "Layanan internet Anda akan diisolir otomatis oleh sistem jika pembayaran tidak segera diselesaikan.\n" .
                             "Bayar sekarang melalui portal:\n" .
                             "👉 {$magicLink}\n\n" .
                             "Abaikan pesan ini jika Anda sudah melakukan pembayaran. Terima kasih.";

                $emailSubject = "🚨 Peringatan Keterlambatan Pembayaran - #{$invoice->invoice_number}";
                $emailBody = "Yth. Bapak/ Ibu {$customer->name},\n\n" .
                             "Tagihan internet Anda sebesar {$amountFormatted} telah melewati jatuh tempo pada {$dueDateFormatted} dan belum kami terima pembayarannya.\n\n" .
                             "No. Invoice: #{$invoice->invoice_number}\n\n" .
                             "Layanan MikroTik internet Anda terancam diisolir otomatis dalam waktu dekat. Harap segera melunasi tagihan melalui portal pelanggan:\n" .
                             "👉 {$magicLink}\n\n" .
                             "Jika Anda sudah membayar, abaikan email ini atau hubungi layanan bantuan kami.\n\n" .
                             "Salam,\n" .
                             "NetBilling ISP";
            }

            // Dispatch WhatsApp
            if (!empty($customer->phone)) {
                SendWhatsAppJob::dispatch($customer->phone, $waMessage);
            }

            // Dispatch Email
            if (!empty($customer->email)) {
                SendEmailJob::dispatch($customer->email, $emailSubject, $emailBody, $customer);
            }

            Log::info("Pengingat otomatis [{$type}] dikirim ke Customer: {$customer->name} (#{$invoice->invoice_number})");
        }
    }
}

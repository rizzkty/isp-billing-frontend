<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\MikroTikActionJob;
use App\Jobs\SendWhatsAppJob;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Invoice;
use App\Services\WhatsAppService;
use App\Services\XenditService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class XenditController extends Controller
{
    protected XenditService $xendit;

    public function __construct(XenditService $xendit)
    {
        $this->xendit = $xendit;
    }

    // =========================================================
    // [ADMIN] Generate payment link untuk satu invoice
    // POST /api/invoices/{invoice}/payment-link
    // =========================================================

    public function createLink(Invoice $invoice)
    {
        if ($invoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice ini sudah lunas.',
            ], 422);
        }

        if ($invoice->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice dibatalkan, tidak bisa dibuat link pembayaran.',
            ], 422);
        }

        $result = $this->xendit->createInvoice($invoice->load(['customer', 'package']));

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat link pembayaran: ' . ($result['error'] ?? 'Unknown error'),
            ], 500);
        }

        AuditLog::record(
            'XENDIT_CREATE_LINK',
            "Payment link dibuat untuk Invoice #{$invoice->id} (Customer: {$invoice->customer->name})"
        );

        return response()->json([
            'success'     => true,
            'message'     => 'Link pembayaran berhasil dibuat.',
            'payment_url' => $result['payment_url'],
            'expires_at'  => $result['expires_at'],
        ]);
    }

    // =========================================================
    // [ADMIN] Generate link + kirim WA ke customer
    // POST /api/invoices/{invoice}/send-payment-link
    // =========================================================

    public function sendViaWhatsApp(Invoice $invoice)
    {
        if ($invoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Invoice ini sudah lunas.',
            ], 422);
        }

        $invoice->load(['customer', 'package']);
        $customer = $invoice->customer;

        // Buat payment link
        $result = $this->xendit->createInvoice($invoice);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat link pembayaran: ' . $result['error'],
            ], 500);
        }

        // Kirim WA via job (non-blocking)
        $paymentUrl  = $result['payment_url'];
        $dueDate     = Carbon::parse($invoice->due_date)->format('d/m/Y');
        $amount      = number_format($invoice->amount, 0, ',', '.');
        $month       = Carbon::create()->month($invoice->month)->format('F');
        $year        = $invoice->year;

        $message = "Halo *{$customer->name}*! 👋\n\n"
                 . "Tagihan internet Anda untuk bulan *{$month} {$year}* telah tersedia.\n\n"
                 . "💰 *Total: Rp {$amount}*\n"
                 . "📅 Jatuh tempo: *{$dueDate}*\n\n"
                 . "Bayar sekarang dengan mudah:\n"
                 . "👉 {$paymentUrl}\n\n"
                 . "Link berlaku *24 jam*. Tersedia: Transfer Bank, QRIS, OVO, GoPay, Dana, dan lainnya.\n\n"
                 . "Terima kasih telah berlangganan! 🙏";

        SendWhatsAppJob::dispatch($customer->phone, $message);

        AuditLog::record(
            'XENDIT_SEND_WA',
            "Payment link dikirim via WA ke {$customer->name} (Invoice #{$invoice->id})"
        );

        return response()->json([
            'success'     => true,
            'message'     => "Link pembayaran berhasil dikirim ke WhatsApp {$customer->name}.",
            'payment_url' => $paymentUrl,
        ]);
    }

    // =========================================================
    // [PUBLIC] Webhook handler dari Xendit
    // POST /api/xendit/webhook
    // =========================================================

    public function handleWebhook(Request $request)
    {
        // 1. Verifikasi token dari header Xendit
        $callbackToken = $request->header('x-callback-token', '');

        if (!$this->xendit->verifyWebhookToken($callbackToken)) {
            Log::warning('Xendit Webhook: Token tidak valid. IP: ' . $request->ip());
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payload = $request->all();

        Log::info('Xendit Webhook diterima: ' . json_encode($payload));

        // 2. Ambil data dari payload
        $xenditInvoiceId = $payload['id'] ?? null;
        $status          = strtoupper($payload['status'] ?? '');
        $paymentMethod   = $payload['payment_method'] ?? null;
        $paidAt          = isset($payload['paid_at']) ? Carbon::parse($payload['paid_at']) : null;

        if (!$xenditInvoiceId) {
            return response()->json(['message' => 'Invalid payload'], 400);
        }

        // 3. Cari invoice terkait
        $invoice = Invoice::where('xendit_invoice_id', $xenditInvoiceId)
            ->with(['customer', 'package'])
            ->first();

        if (!$invoice) {
            Log::warning("Xendit Webhook: Invoice dengan xendit_id {$xenditInvoiceId} tidak ditemukan.");
            // Return 200 agar Xendit tidak retry terus
            return response()->json(['message' => 'Invoice not found, ignored'], 200);
        }

        // Idempotency: Jika status invoice di DB sudah paid, abaikan webhook ini
        if ($invoice->status === 'paid') {
            Log::info("Xendit Webhook: Invoice #{$invoice->id} sudah berstatus paid. Mengabaikan webhook.");
            return response()->json(['message' => 'Invoice already paid'], 200);
        }

        // 4. Update status di database (dalam transaksi)
        DB::transaction(function () use ($invoice, $status, $paymentMethod, $paidAt, $payload) {
            $invoice->update([
                'xendit_status' => $status,
            ]);

            if ($status === 'PAID') {
                $invoice->update([
                    'status'         => 'paid',
                    'xendit_paid_at' => $paidAt ?? now(),
                    'payment_method' => $paymentMethod,
                    'notes'          => ($invoice->notes ? $invoice->notes . ' | ' : '')
                                      . "Bayar via Xendit ({$paymentMethod}) pada " . now()->format('d/m/Y H:i'),
                ]);

                Log::info("Xendit Webhook: Invoice #{$invoice->id} berhasil dibayar via {$paymentMethod}");

                // 5. Auto-unblock MikroTik jika customer sedang diisolir
                $this->autoUnblockCustomer($invoice->customer);

                // 6. Kirim WA konfirmasi ke customer
                $this->sendPaymentConfirmationWA($invoice);

                // 7. Catat audit log
                AuditLog::record(
                    'XENDIT_PAYMENT_RECEIVED',
                    "Pembayaran diterima via Xendit untuk Invoice #{$invoice->id} — {$invoice->customer->name} — "
                    . "Rp " . number_format($invoice->amount, 0, ',', '.') . " via {$paymentMethod}"
                );
            }

            if ($status === 'EXPIRED') {
                Log::info("Xendit Webhook: Invoice #{$invoice->id} expired.");
            }
        });

        return response()->json(['message' => 'Webhook berhasil diproses'], 200);
    }

    // =========================================================
    // PRIVATE HELPERS
    // =========================================================

    /**
     * Auto-unblock customer dari isolir MikroTik setelah bayar.
     */
    protected function autoUnblockCustomer(Customer $customer): void
    {
        if ($customer->status !== 'isolated' && $customer->status !== 'suspend') {
            return;
        }

        // Update status customer → aktif
        $customer->update(['status' => 'aktif']);

        // Dispatch MikroTik job untuk remove dari ISOLIR_LIST
        if ($customer->ip_address) {
            MikroTikActionJob::dispatch('remove', $customer->ip_address, $customer->name);
            Log::info("Auto-Unblock: Customer {$customer->name} ({$customer->ip_address}) dilepas dari isolir.");
        }
    }

    /**
     * Kirim WA konfirmasi pembayaran ke customer.
     */
    protected function sendPaymentConfirmationWA(Invoice $invoice): void
    {
        $customer  = $invoice->customer;
        $amount    = number_format($invoice->amount, 0, ',', '.');
        $month     = Carbon::create()->month($invoice->month)->format('F');
        $year      = $invoice->year;
        $paidAt    = Carbon::parse($invoice->xendit_paid_at)->format('d/m/Y H:i');
        $method    = $this->formatPaymentMethod($invoice->payment_method);

        $message = "✅ *Pembayaran Dikonfirmasi!*\n\n"
                 . "Halo *{$customer->name}*,\n"
                 . "Pembayaran internet Anda untuk bulan *{$month} {$year}* telah berhasil diterima.\n\n"
                 . "💰 Jumlah: *Rp {$amount}*\n"
                 . "💳 Metode: *{$method}*\n"
                 . "🕐 Waktu: *{$paidAt}*\n"
                 . "📋 Invoice: *#{$invoice->id}*\n\n"
                 . "Koneksi internet Anda tetap aktif. Terima kasih! 🙏\n"
                 . "_NetBilling ISP_";

        if ($customer->phone) {
            SendWhatsAppJob::dispatch($customer->phone, $message);
        }
    }

    /**
     * Format nama metode pembayaran agar lebih readable.
     */
    protected function formatPaymentMethod(?string $method): string
    {
        if (!$method) return 'Online';

        $map = [
            'BANK_TRANSFER' => 'Transfer Bank',
            'BCA'           => 'BCA Virtual Account',
            'BNI'           => 'BNI Virtual Account',
            'BRI'           => 'BRI Virtual Account',
            'MANDIRI'       => 'Mandiri Virtual Account',
            'PERMATA'       => 'Permata Virtual Account',
            'QRIS'          => 'QRIS',
            'OVO'           => 'OVO',
            'DANA'          => 'DANA',
            'SHOPEEPAY'     => 'ShopeePay',
            'GOPAY'         => 'GoPay',
            'ALFAMART'      => 'Alfamart',
            'INDOMARET'     => 'Indomaret',
        ];

        return $map[strtoupper($method)] ?? ucfirst(strtolower($method));
    }
}

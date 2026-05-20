<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * XenditService — mengelola semua komunikasi dengan Xendit API
 *
 * Dokumentasi: https://developers.xendit.co/api-reference/#invoices
 */
class XenditService
{
    protected string $secretKey;
    protected string $webhookToken;
    protected bool   $isSandbox;
    protected string $baseUrl = 'https://api.xendit.co';

    public function __construct()
    {
        // Prioritaskan dari database (Setting), jika kosong gunakan .env/config
        $dbSecret = Setting::where('key', 'xendit_secret_key')->value('value');
        $dbWebhook = Setting::where('key', 'xendit_webhook_token')->value('value');
        $dbSandbox = Setting::where('key', 'xendit_sandbox')->value('value');

        $this->secretKey    = $dbSecret ?: config('xendit.secret_key', env('XENDIT_SECRET_KEY', ''));
        $this->webhookToken = $dbWebhook ?: config('xendit.webhook_token', env('XENDIT_WEBHOOK_TOKEN', ''));
        
        if ($dbSandbox !== null) {
            $this->isSandbox = filter_var($dbSandbox, FILTER_VALIDATE_BOOLEAN);
        } else {
            $this->isSandbox = (bool) env('XENDIT_SANDBOX', true);
        }
    }

    // =========================================================
    // CREATE INVOICE / PAYMENT LINK
    // =========================================================

    /**
     * Buat Xendit Invoice dan dapatkan payment URL.
     *
     * @param  Invoice $invoice   Invoice yang mau dibayar
     * @return array{
     *   success: bool,
     *   xendit_invoice_id: string|null,
     *   payment_url: string|null,
     *   expires_at: string|null,
     *   error: string|null
     * }
     */
    public function createInvoice(Invoice $invoice): array
    {
        if (empty($this->secretKey)) {
            Log::error('Xendit: Secret key belum dikonfigurasi.');
            return ['success' => false, 'error' => 'Xendit secret key belum dikonfigurasi.'];
        }

        // Jika sudah ada payment link yang masih valid, kembalikan yang lama
        if ($invoice->hasActivePaymentLink()) {
            return [
                'success'          => true,
                'xendit_invoice_id' => $invoice->xendit_invoice_id,
                'payment_url'      => $invoice->xendit_payment_url,
                'expires_at'       => $invoice->xendit_expires_at,
                'error'            => null,
            ];
        }

        $invoice->load(['customer', 'package']);
        $customer = $invoice->customer;

        // Bangun external_id unik — dipakai Xendit untuk idempotency
        $externalId = "INV-{$invoice->id}-" . now()->format('YmdHis');

        $payload = [
            'external_id'      => $externalId,
            'amount'           => (int) $invoice->amount,
            'description'      => "Tagihan Internet — {$customer->name} ({$invoice->month}/{$invoice->year})",
            'customer'         => [
                'given_names'  => $customer->name,
                'email'        => $customer->email ?? null,
                'mobile_number' => $this->formatPhone($customer->phone ?? ''),
            ],
            'customer_notification_preference' => [
                'invoice_created'  => ['whatsapp', 'sms'],
                'invoice_reminder' => ['whatsapp'],
                'invoice_paid'     => ['whatsapp'],
            ],
            'invoice_duration' => 86400, // 24 jam (dalam detik)
            'currency'         => 'IDR',
            'items'            => [
                [
                    'name'     => "Paket Internet: " . ($invoice->package->name ?? 'ISP'),
                    'quantity' => 1,
                    'price'    => (int) $invoice->amount,
                    'category' => 'Internet Service',
                ],
            ],
            'payment_methods' => $this->getActivePaymentMethods(),
            'success_redirect_url' => env('XENDIT_SUCCESS_URL', 'http://localhost:5173/portal/payment/success'),
            'failure_redirect_url' => env('XENDIT_FAILURE_URL', 'http://localhost:5173/portal/payment/failed'),
        ];

        try {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->timeout(30)
                ->post("{$this->baseUrl}/v2/invoices", $payload);

            if ($response->successful()) {
                $data      = $response->json();
                $expiresAt = Carbon::parse($data['expiry_date'] ?? now()->addDay());

                // Simpan ke invoice
                $invoice->update([
                    'xendit_invoice_id' => $data['id'],
                    'xendit_payment_url' => $data['invoice_url'],
                    'xendit_status'      => 'PENDING',
                    'xendit_expires_at'  => $expiresAt,
                ]);

                Log::info("Xendit: Invoice {$data['id']} berhasil dibuat untuk Invoice #{$invoice->id}");

                return [
                    'success'           => true,
                    'xendit_invoice_id' => $data['id'],
                    'payment_url'       => $data['invoice_url'],
                    'expires_at'        => $expiresAt->toIso8601String(),
                    'error'             => null,
                ];
            }

            $errorBody = $response->json();
            Log::error("Xendit: Gagal buat invoice. Status: {$response->status()}. Body: " . json_encode($errorBody));

            return [
                'success' => false,
                'error'   => $errorBody['message'] ?? 'Gagal membuat invoice di Xendit.',
            ];

        } catch (\Exception $e) {
            Log::error("Xendit: Exception saat buat invoice: " . $e->getMessage());
            return [
                'success' => false,
                'error'   => 'Terjadi kesalahan koneksi ke Xendit.',
            ];
        }
    }

    // =========================================================
    // VERIFY WEBHOOK SIGNATURE
    // =========================================================

    /**
     * Validasi bahwa webhook benar-benar dari Xendit.
     * Xendit mengirim header x-callback-token yang harus dicocokkan.
     *
     * @param  string $callbackToken  nilai dari header 'x-callback-token'
     * @return bool
     */
    public function verifyWebhookToken(string $callbackToken): bool
    {
        if (empty($this->webhookToken)) {
            Log::warning('Xendit: Webhook token belum dikonfigurasi. Melewati verifikasi.');
            return true; // di sandbox, bisa lewati dulu
        }

        return hash_equals($this->webhookToken, $callbackToken);
    }

    // =========================================================
    // GET INVOICE STATUS (polling opsional)
    // =========================================================

    /**
     * Cek status invoice langsung ke Xendit API (untuk sinkronisasi manual).
     *
     * @param  string $xenditInvoiceId
     * @return array|null
     */
    public function getInvoiceStatus(string $xenditInvoiceId): ?array
    {
        try {
            $response = Http::withBasicAuth($this->secretKey, '')
                ->timeout(15)
                ->get("{$this->baseUrl}/v2/invoices/{$xenditInvoiceId}");

            if ($response->successful()) {
                return $response->json();
            }

            Log::error("Xendit: Gagal get status invoice {$xenditInvoiceId}");
            return null;

        } catch (\Exception $e) {
            Log::error("Xendit: Exception get invoice status: " . $e->getMessage());
            return null;
        }
    }

    // =========================================================
    // HELPER
    // =========================================================

    /**
     * Format nomor HP ke format internasional +62
     */
    protected function formatPhone(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);

        if (str_starts_with($phone, '0')) {
            return '+62' . substr($phone, 1);
        } elseif (str_starts_with($phone, '62')) {
            return '+' . $phone;
        } elseif (str_starts_with($phone, '8')) {
            return '+62' . $phone;
        }

        return $phone;
    }

    /**
     * Ambil metode pembayaran aktif dari settings, atau fallback ke default.
     */
    protected function getActivePaymentMethods(): array
    {
        $dbMethods = Setting::where('key', 'xendit_payment_methods')->value('value');
        
        if ($dbMethods) {
            $decoded = json_decode($dbMethods, true);
            if (is_array($decoded) && count($decoded) > 0) {
                return $decoded;
            }
        }
        
        // Fallback default jika belum diatur
        return [
            'BCA', 'BNI', 'BRI', 'MANDIRI', 'PERMATA',
            'ALFAMART', 'INDOMARET',
            'QRIS', 'OVO', 'DANA', 'SHOPEEPAY',
        ];
    }
}

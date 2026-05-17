<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerToken;
use App\Jobs\SendWhatsAppJob;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * CustomerAuthController — Mengelola autentikasi customer via Magic Link WA
 */
class CustomerAuthController extends Controller
{
    // =========================================================
    // REQUEST MAGIC LINK
    // POST /api/portal/auth/request-link
    // Body: { "identifier": "0812xxxxxx" } OR { "identifier": "CUST-001" }
    // =========================================================

    public function requestLink(Request $request)
    {
        $request->validate([
            'identifier' => 'required|string|min:3|max:50',
        ]);

        $identifier = trim($request->identifier);

        // Cari customer berdasarkan customer_id atau nomor HP
        // Karena phone dienkripsi, kita pakai customer_id dulu, phone di-loop (terbatas)
        $customer = $this->findCustomer($identifier);

        // Selalu return success untuk mencegah user enumeration attack
        if (!$customer) {
            Log::info("Portal Auth: Identifier '{$identifier}' tidak ditemukan.");
            return response()->json([
                'success' => true,
                'message' => 'Jika data Anda terdaftar, link login telah dikirim ke WhatsApp Anda.',
            ]);
        }

        if ($customer->status !== 'aktif') {
            // Tetap kirim WA tapi beri info
            Log::info("Portal Auth: Customer {$customer->name} mencoba login tapi status: {$customer->status}");
        }

        // Hapus magic link lama yang belum expired milik customer ini
        CustomerToken::where('customer_id', $customer->id)
            ->where('type', 'magic_link')
            ->whereNull('used_at')
            ->delete();

        // Generate token baru
        $rawToken = Str::random(48); // 48 karakter random
        $token = CustomerToken::create([
            'customer_id' => $customer->id,
            'token'       => $rawToken,
            'type'        => 'magic_link',
            'expires_at'  => now()->addMinutes(15), // Link valid 15 menit
        ]);

        // Kirim WA dengan magic link
        $magicLink = env('APP_FRONTEND_URL', 'http://localhost:5173')
                   . "/portal/verify?token={$rawToken}";

        $message = "🔐 *Login Portal NetBilling*\n\n"
                 . "Halo *{$customer->name}*!\n\n"
                 . "Klik link berikut untuk masuk ke portal pelanggan:\n"
                 . "👉 {$magicLink}\n\n"
                 . "⏰ Link berlaku selama *15 menit*.\n"
                 . "Jangan bagikan link ini ke siapa pun.\n\n"
                 . "_Jika Anda tidak meminta ini, abaikan pesan ini._";

        SendWhatsAppJob::dispatch($customer->phone, $message);

        Log::info("Portal Auth: Magic link dikirim ke customer {$customer->name} ({$customer->customer_id})");

        return response()->json([
            'success' => true,
            'message' => 'Jika data Anda terdaftar, link login telah dikirim ke WhatsApp Anda.',
        ]);
    }

    // =========================================================
    // VERIFY MAGIC LINK TOKEN
    // POST /api/portal/auth/verify-link
    // Body: { "token": "xxxxx" }
    // =========================================================

    public function verifyLink(Request $request)
    {
        $request->validate([
            'token' => 'required|string|size:48',
        ]);

        $rawToken = $request->token;

        // Cari token yang valid
        $tokenRecord = CustomerToken::with('customer')
            ->where('token', $rawToken)
            ->where('type', 'magic_link')
            ->valid() // scope: belum dipakai & belum expired
            ->first();

        if (!$tokenRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Link tidak valid atau sudah kadaluarsa. Silakan minta link baru.',
            ], 401);
        }

        $customer = $tokenRecord->customer;

        // Tandai token sebagai sudah digunakan
        $tokenRecord->markAsUsed();

        // Buat session token (tipe 'session', tidak ada expiry ketat — bisa diset di middleware)
        $sessionToken = Str::random(64);
        CustomerToken::create([
            'customer_id' => $customer->id,
            'token'       => $sessionToken,
            'type'        => 'session',
            'expires_at'  => now()->addDays(7), // Session 7 hari
        ]);

        Log::info("Portal Auth: Customer {$customer->name} berhasil login via magic link.");

        return response()->json([
            'success'  => true,
            'message'  => 'Login berhasil!',
            'token'    => $sessionToken,
            'customer' => [
                'id'          => $customer->id,
                'customer_id' => $customer->customer_id,
                'name'        => $customer->name,
                'status'      => $customer->status,
            ],
        ]);
    }

    // =========================================================
    // LOGOUT
    // POST /api/portal/auth/logout
    // =========================================================

    public function logout(Request $request)
    {
        $token = $request->bearerToken();

        if ($token) {
            CustomerToken::where('token', $token)
                ->where('type', 'session')
                ->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    // =========================================================
    // DEMO LOGIN (BYPASS)
    // POST /api/portal/auth/demo
    // =========================================================

    public function demoLogin(Request $request)
    {
        $type = $request->type ?? 'lunas';

        $scenarios = [
            'lunas' => [
                'id' => 'CUST-DEMO-01',
                'name' => 'Agus Demo (SOHO 50 Mbps)',
                'status' => 'aktif',
                'package' => 'SOHO 50 Mbps',
                'price' => 350000
            ],
            'peringatan' => [
                'id' => 'CUST-DEMO-02',
                'name' => 'Budi Demo (Peringatan)',
                'status' => 'aktif',
                'package' => 'Home 20 Mbps',
                'price' => 250000
            ],
            'terisolir' => [
                'id' => 'CUST-DEMO-08',
                'name' => 'Hani Demo (Terisolir)',
                'status' => 'terisolir',
                'package' => 'Home 20 Mbps',
                'price' => 250000
            ],
        ];

        $data = $scenarios[$type] ?? $scenarios['lunas'];

        try {
            // Cari atau buat customer demo
            $customer = Customer::where('customer_id', $data['id'])->first();

            if (!$customer) {
                $customer = Customer::create([
                    'customer_id' => $data['id'],
                    'name'        => $data['name'],
                    'phone'       => '081234567890',
                    'email'       => 'demo@netbilling.com',
                    'address'     => 'Jl. Digital No. 101, Jakarta',
                    'package_name'=> $data['package'],
                    'status'      => $data['status'],
                    'installation_date' => now()->subMonths(3),
                    'package_id'  => \App\Models\Package::first()?->id,
                ]);
            } else {
                // Update status if needed
                $customer->update([
                    'status' => $data['status'], 
                    'name' => $data['name'],
                    'package_name' => $data['package']
                ]);
            }

            // Buat session token
            $sessionToken = Str::random(64);
            CustomerToken::create([
                'customer_id' => $customer->id,
                'token'       => $sessionToken,
                'type'        => 'session',
                'expires_at'  => now()->addDays(30), // Session demo lebih lama
            ]);

            return response()->json([
                'success'  => true,
                'message'  => 'Masuk sebagai Demo: ' . ucfirst($type),
                'token'    => $sessionToken,
                'customer' => $customer
            ]);
        } catch (\Exception $e) {
            Log::error('Demo Login Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal masuk ke mode demo: ' . $e->getMessage()
            ], 500);
        }
    }

    // =========================================================
    // PRIVATE: Cari customer berdasarkan customer_id atau phone
    // =========================================================

    protected function findCustomer(string $identifier): ?Customer
    {
        // Prioritas 1: cari by customer_id (format CUST-xxx atau angka)
        $customer = Customer::where('customer_id', $identifier)->first();
        if ($customer) return $customer;

        // Prioritas 2: cari by phone — karena phone dienkripsi, kita decrypt satu-per-satu
        // Normalkan input dulu
        $normalizedPhone = $this->normalizePhone($identifier);

        // Ambil semua customer dan cek phone (cara ini oke untuk ribuan customer, bukan jutaan)
        // Untuk scale besar, pertimbangkan index terpisah untuk phone search
        $allCustomers = Customer::whereNotNull('phone')->get();

        foreach ($allCustomers as $c) {
            try {
                $decryptedPhone = $this->normalizePhone($c->phone ?? '');
                if ($decryptedPhone === $normalizedPhone) {
                    return $c;
                }
            } catch (\Exception $e) {
                // Skip jika decrypt gagal
                continue;
            }
        }

        return null;
    }

    /**
     * Normalkan nomor telepon ke format 628xxx untuk perbandingan
     */
    protected function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);

        if (str_starts_with($phone, '0')) {
            return '62' . substr($phone, 1);
        } elseif (str_starts_with($phone, '8')) {
            return '62' . $phone;
        }

        return $phone;
    }
}

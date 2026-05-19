<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\CustomerToken;
use App\Models\Invoice;
use App\Models\Ticket;
use App\Services\XenditService;
use Illuminate\Http\Request;
use Carbon\Carbon;

/**
 * CustomerPortalController — Endpoint untuk customer yang sudah login ke portal
 * Semua endpoint ini dilindungi middleware customer.auth
 */
class CustomerPortalController extends Controller
{
    protected XenditService $xendit;

    public function __construct(XenditService $xendit)
    {
        $this->xendit = $xendit;
    }

    // =========================================================
    // GET /api/portal/me — Profile customer & Live Stats
    // =========================================================

    public function profile(Request $request)
    {
        $customer = $request->customer; // dari middleware
        $customer->load('package');

        // Fetch Live Stats from Radius
        $stats = $this->getConnectionStats($customer);

        // Demo Package Fallback
        $packageName = $customer->package_name ?: ($customer->package ? $customer->package->name : 'Standard Home');
        $packageSpeed = $customer->package ? $customer->package->speed : '20 Mbps';
        $packagePrice = $customer->package ? $customer->package->price : 250000;

        // Custom speeds for demo
        if (str_contains($customer->customer_id, '01')) {
            $packageSpeed = '50 Mbps';
            $packagePrice = 350000;
        } else if (str_contains($customer->customer_id, '02') || str_contains($customer->customer_id, '08')) {
            $packageSpeed = '20 Mbps';
            $packagePrice = 250000;
        }

        return response()->json([
            'success'  => true,
            'customer' => [
                'id'                => $customer->id,
                'customer_id'       => $customer->customer_id,
                'name'              => $customer->name,
                'phone'             => $this->maskPhone($customer->phone),
                'email'             => $customer->email,
                'address'           => $customer->address,
                'status'            => $customer->status,
                'installation_date' => $customer->installation_date,
                'package'           => [
                    'name'  => $packageName,
                    'speed' => $packageSpeed,
                    'price' => $packagePrice,
                ],
                'connection'        => $stats,
            ],
        ]);
    }

    // =========================================================
    // GET /api/portal/invoices — List invoice milik customer ini
    // =========================================================

    public function invoices(Request $request)
    {
        $customer = $request->customer;

        // Demo Logic
        if (str_contains($customer->customer_id, 'DEMO')) {
            $mockData = $this->getMockPortalInvoices($customer->customer_id);
            return response()->json([
                'success'  => true,
                'invoices' => $mockData['invoices'],
                'summary'  => $mockData['summary'],
            ]);
        }

        $invoices = Invoice::where('customer_id', $customer->id)
            ->with('package:id,name,speed')
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get()
            ->map(function ($inv) {
                return [
                    'id'              => $inv->id,
                    'month'           => $inv->month,
                    'year'            => $inv->year,
                    'period'          => Carbon::create()->month($inv->month)->format('F') . ' ' . $inv->year,
                    'amount'          => $inv->amount,
                    'status'          => $inv->status,
                    'due_date'        => $inv->due_date?->format('d/m/Y'),
                    'payment_method'  => $inv->payment_method,
                    'paid_at'         => $inv->xendit_paid_at?->format('d/m/Y H:i'),
                    'has_payment_link' => $inv->hasActivePaymentLink(),
                    'payment_url'     => $inv->hasActivePaymentLink() ? $inv->xendit_payment_url : null,
                    'package'         => $inv->package?->name,
                ];
            });

        // Summary
        $totalUnpaid  = $invoices->where('status', 'unpaid')->sum('amount');
        $totalPaid    = $invoices->where('status', 'paid')->sum('amount');

        return response()->json([
            'success'      => true,
            'invoices'     => $invoices,
            'summary'      => [
                'total_unpaid' => $totalUnpaid,
                'total_paid'   => $totalPaid,
                'unpaid_count' => $invoices->where('status', 'unpaid')->count(),
            ],
        ]);
    }

    // =========================================================
    // GET /api/portal/invoices/{id} — Detail invoice
    // =========================================================

    public function invoiceDetail(Request $request, int $id)
    {
        $customer = $request->customer;

        $invoice = Invoice::where('id', $id)
            ->where('customer_id', $customer->id) // pastikan milik customer ini
            ->with('package')
            ->first();

        if (!$invoice) {
            return response()->json(['success' => false, 'message' => 'Invoice tidak ditemukan.'], 404);
        }

        return response()->json([
            'success' => true,
            'invoice' => [
                'id'              => $invoice->id,
                'month'           => $invoice->month,
                'year'            => $invoice->year,
                'period'          => Carbon::create()->month($invoice->month)->format('F') . ' ' . $invoice->year,
                'amount'          => $invoice->amount,
                'status'          => $invoice->status,
                'due_date'        => $invoice->due_date?->format('d/m/Y'),
                'notes'           => $invoice->notes,
                'payment_method'  => $invoice->payment_method,
                'paid_at'         => $invoice->xendit_paid_at?->format('d/m/Y H:i'),
                'xendit_status'   => $invoice->xendit_status,
                'has_payment_link' => $invoice->hasActivePaymentLink(),
                'payment_url'     => $invoice->hasActivePaymentLink() ? $invoice->xendit_payment_url : null,
                'package'         => $invoice->package ? [
                    'name'  => $invoice->package->name,
                    'speed' => $invoice->package->speed,
                ] : null,
            ],
        ]);
    }

    // =========================================================
    // GET /api/portal/invoices/{id}/pay — Dapatkan/buat Xendit payment URL
    // =========================================================

    public function getPaymentUrl(Request $request, int $id)
    {
        $customer = $request->customer;

        // --- Demo Logic ---
        if (str_contains($customer->customer_id, 'DEMO')) {
            return response()->json([
                'success'     => true,
                'payment_url' => 'https://checkout-staging.xendit.co/web/demo',
                'expires_at'  => now()->addDay()->toIso8601String(),
            ]);
        }

        $invoice = Invoice::where('id', $id)
            ->where('customer_id', $customer->id)
            ->with(['customer', 'package'])
            ->first();

        if (!$invoice) {
            return response()->json(['success' => false, 'message' => 'Invoice tidak ditemukan.'], 404);
        }

        if ($invoice->status === 'paid') {
            return response()->json(['success' => false, 'message' => 'Invoice ini sudah lunas.'], 422);
        }

        if ($invoice->status === 'cancelled') {
            return response()->json(['success' => false, 'message' => 'Invoice ini dibatalkan.'], 422);
        }

        // Buat/ambil payment link
        $result = $this->xendit->createInvoice($invoice);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat link pembayaran. Silakan coba lagi.',
            ], 500);
        }

        return response()->json([
            'success'     => true,
            'payment_url' => $result['payment_url'],
            'expires_at'  => $result['expires_at'],
        ]);
    }

    // =========================================================
    // GET /api/portal/tickets — Tiket milik customer
    // =========================================================

    public function tickets(Request $request)
    {
        $customer = $request->customer;

        // Demo Logic
        if (str_contains($customer->customer_id, 'DEMO')) {
            $mockTickets = [];
            
            if (str_contains($customer->customer_id, '08')) { // Hani Demo
                $mockTickets = [
                    ['id' => 1003, 'title' => 'Sudah Bayar Tapi Masih Terisolir', 'status' => 'open', 'priority' => 'medium', 'category' => 'Billing', 'created_at' => now()->subDays(1)->toIso8601String()],
                    ['id' => 9002, 'title' => 'Cara bayar via Indomaret', 'status' => 'closed', 'priority' => 'low', 'category' => 'Billing', 'created_at' => now()->subMonth()->toIso8601String()],
                ];
            } else if ($customer->customer_id === 'CUST-DEMO-02') { // Budi Demo
                $mockTickets = [
                    ['id' => 1002, 'title' => 'Koneksi Mati Total (Gangguan Massal)', 'status' => 'in_progress', 'priority' => 'urgent', 'category' => 'Network', 'created_at' => now()->subMinutes(45)->toIso8601String()],
                ];
            } else if ($customer->customer_id === 'CUST-DEMO-01') { // Agus Demo
                 $mockTickets = [
                    ['id' => 1004, 'title' => 'Koneksi Lemot Sering Putus', 'status' => 'resolved', 'priority' => 'low', 'category' => 'Network', 'created_at' => now()->subDays(3)->toIso8601String()],
                 ];
            }

            return response()->json([
                'success' => true,
                'tickets' => $mockTickets,
            ]);
        }

        $tickets = Ticket::where('customer_id', $customer->id)
            ->orderByDesc('created_at')
            ->get(['id', 'title', 'status', 'priority', 'category', 'created_at', 'updated_at']);

        return response()->json([
            'success' => true,
            'tickets' => $tickets,
        ]);
    }

    // =========================================================
    // POST /api/portal/tickets — Buat tiket baru dari portal
    // =========================================================

    public function createTicket(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'required|string|min:10',
            'category'    => 'nullable|in:Network,Billing,Hardware,Other',
        ]);

        $customer = $request->customer;

        $ticket = Ticket::create([
            'customer_id' => $customer->id,
            'title'       => $request->title,
            'description' => $request->description,
            'category'    => $request->category ?? 'Other',
            'priority'    => 'Medium', // default untuk tiket dari customer
            'status'      => 'open',
            'created_by'  => 'customer_portal',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tiket berhasil dibuat. Tim kami akan segera menghubungi Anda.',
            'ticket'  => [
                'id'     => $ticket->id,
                'title'  => $ticket->title,
                'status' => $ticket->status,
            ],
        ], 201);
    }

    /**
     * Get Live Connection Stats from Radius Database
     */
    protected function getConnectionStats($customer)
    {
        // For Demo Account, return simulated live data
        if (str_contains($customer->customer_id, 'DEMO')) {
            $isAgus = str_contains($customer->customer_id, '01');
            $isBudi = str_contains($customer->customer_id, '02');
            $isHani = str_contains($customer->customer_id, '08');
            
            $isConnected = ($isAgus || $isBudi); // Agus & Budi are online
            $uptimeSeconds = $isConnected ? (32000 + (time() % 3600)) : 0;
            
            // Random variation for "Live" feel
            $down = $isConnected ? (150 + (rand(0, 500) / 10)) : 0;
            $up = $isConnected ? (2 + (rand(0, 100) / 10)) : 0;

            return [
                'is_connected' => $isConnected,
                'ip_address'   => $isConnected ? '192.168.100.' . (100 + ($customer->id % 100)) : '-',
                'uptime'       => $isConnected ? floor($uptimeSeconds / 3600) . "j " . floor(($uptimeSeconds % 3600) / 60) . "m" : '-',
                'download'     => $down . ' MiB',
                'upload'       => $up . ' MiB',
                'mac_address'  => 'E5:F6:A7:B8:C9:' . dechex($customer->id % 255),
            ];
        }

        // Real Logic: Connect to Radius DB
        $settings = \App\Models\Setting::whereIn('key', ['dbHost', 'dbPort', 'dbUser', 'dbPass', 'dbName'])
                           ->pluck('value', 'key');
        
        $dbHost = $settings->get('dbHost');
        if (empty($dbHost)) {
            return ['is_connected' => false, 'message' => 'Radius not configured'];
        }

        try {
            $dbPassRaw = $settings->get('dbPass', '');
            try {
                $dbPass = !empty($dbPassRaw) ? \Illuminate\Support\Facades\Crypt::decryptString($dbPassRaw) : '';
            } catch (\Exception $e) { $dbPass = $dbPassRaw; }

            $dsn = "mysql:host={$dbHost};port=" . $settings->get('dbPort', '3306') . ";dbname=" . $settings->get('dbName', 'radius') . ";charset=utf8mb4";
            $pdo = new \PDO($dsn, $settings->get('dbUser'), $dbPass, [\PDO::ATTR_TIMEOUT => 2]);

            // Cari session aktif berdasarkan customer_id atau phone
            $stmt = $pdo->prepare("SELECT framedipaddress, acctsessiontime, acctinputoctets, acctoutputoctets, callingstationid 
                                   FROM radacct 
                                   WHERE username = ? AND acctstoptime IS NULL 
                                   ORDER BY acctstarttime DESC LIMIT 1");
            $stmt->execute([$customer->customer_id]);
            $session = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($session) {
                return [
                    'is_connected' => true,
                    'ip_address'   => $session['framedipaddress'],
                    'uptime'       => gmdate("H\h i\m", $session['acctsessiontime']),
                    'download'     => round($session['acctoutputoctets'] / 1048576, 2) . ' MiB',
                    'upload'       => round($session['acctinputoctets'] / 1048576, 2) . ' MiB',
                    'mac_address'  => $session['callingstationid'],
                ];
            }
        } catch (\Exception $e) {
            // Silently fail to not break the portal if Radius is down
        }

        return [
                'is_connected' => false,
            'ip_address'   => '-',
            'uptime'       => '-',
            'download'     => '0 MiB',
            'upload'       => '0 MiB',
        ];
    }

    protected function getMockPortalInvoices($custId)
    {
        $now = Carbon::now();
        $invoices = [];
        $packagePrice = 250000;
        
        // Skenario khusus berdasarkan ID
        $unpaidCount = 0;
        $packagePrice = 250000;
        $packageName = 'Home 20 Mbps';

        if (str_contains($customerId, '02')) { // Budi Demo (Peringatan)
            $unpaidCount = 1;
            $packagePrice = 250000;
            $packageName = 'Home 20 Mbps';
        } else if (str_contains($customerId, '08')) { // Hani Demo (Terisolir)
            $unpaidCount = 3;
            $packagePrice = 250000;
            $packageName = 'Home 20 Mbps';
        } else if (str_contains($customerId, '01')) { // Agus Demo (Lunas)
            $unpaidCount = 0;
            $packagePrice = 350000;
            $packageName = 'SOHO 50 Mbps';
        }

        // Buat 6 bulan historis
        for ($i = 0; $i < 6; $i++) {
            $date = Carbon::now()->subMonths($i);
            $status = ($i < $unpaidCount) ? 'unpaid' : 'paid';
            
            $invoices[] = [
                'id'              => 9000 + $i,
                'month'           => $date->month,
                'year'            => $date->year,
                'period'          => $date->translatedFormat('F Y'),
                'amount'          => $packagePrice,
                'status'          => $status,
                'due_date'        => $date->copy()->startOfMonth()->addDays(9)->format('d/m/Y'),
                'payment_method'  => $status === 'paid' ? 'Xendit - VA' : null,
                'paid_at'         => $status === 'paid' ? $date->copy()->startOfMonth()->addDays(5)->format('d/m/Y H:i') : null,
                'has_payment_link' => $status === 'unpaid',
                'payment_url'     => $status === 'unpaid' ? 'https://checkout.xendit.co/web/demo' : null,
                'package'         => $packageName,
            ];
        }

        $totalUnpaid = 0;
        $totalPaid = 0;
        foreach ($invoices as $inv) {
            if ($inv['status'] === 'unpaid') $totalUnpaid += $inv['amount'];
            else $totalPaid += $inv['amount'];
        }

        return [
            'invoices' => $invoices,
            'summary'  => [
                'total_unpaid' => $totalUnpaid,
                'total_paid'   => $totalPaid,
                'unpaid_count' => $unpaidCount,
            ],
        ];
    }

    /**
     * Mask nomor HP untuk privasi: 0812****5678
     */
    protected function maskPhone(?string $phone): ?string
    {
        if (!$phone) return '-';
        
        // Handle decrypted phone if it was cast to encrypted in model
        $clean = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($clean) < 8) return $phone;

        $start  = substr($clean, 0, 4);
        $end    = substr($clean, -4);
        $masked = '****';

        return $start . $masked . $end;
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Customer;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;


class InvoiceController extends Controller
{
    /**
     * Generate PDF Invoice
     */
    public function print(Invoice $invoice)
    {
        $invoice->load(['customer', 'package']);
        
        $pdf = Pdf::loadView('pdf.invoice', compact('invoice'));
        
        return $pdf->download("Invoice-{$invoice->id}.pdf");
    }

    public function index()
    {
        $invoices = Invoice::with(['customer:id,name', 'package:id,name,speed'])
            ->latest()
            ->get();

        return response()->json($invoices);
    }

    /**
     * Generate invoices for all active customers for the current month
     */
    public function generate(Request $request)
    {
        $month = $request->month ?? Carbon::now()->month;
        $year = $request->year ?? Carbon::now()->year;

        $customers = Customer::where('status', 'aktif')->with('package')->get();

        $count = DB::transaction(function () use ($customers, $month, $year) {
            $created = 0;
            foreach ($customers as $customer) {
                if (!$customer->package) continue;

                // Cek apakah invoice sudah ada untuk bulan/tahun ini
                $exists = Invoice::where('customer_id', $customer->id)
                    ->where('month', $month)
                    ->where('year', $year)
                    ->exists();

                if (!$exists) {
                    Invoice::create([
                        'customer_id' => $customer->id,
                        'package_id' => $customer->package_id,
                        'amount' => $customer->package->price,
                        'status' => 'unpaid',
                        'due_date' => Carbon::create($year, $month, 10),
                        'month' => $month,
                        'year' => $year,
                    ]);
                    $created++;
                }
            }
            return $created;
        });

        AuditLog::record('GENERATE_INVOICE', "Generate {$count} tagihan periode {$month}/{$year}");

        return response()->json([
            'message' => "$count tagihan baru berhasil dibuat untuk periode $month/$year"
        ]);
    }

    public function show(Invoice $invoice)
    {
        return response()->json($invoice->load(['customer', 'package']));
    }

    public function update(Request $request, Invoice $invoice)
    {
        $request->validate([
            'status' => 'required|in:paid,unpaid,cancelled',
        ]);

        $invoice->update($request->all());

        if ($request->status === 'paid') {
            AuditLog::record('PAYMENT_VERIFIED', "Verifikasi pembayaran tagihan #{$invoice->id}");
        }

        return response()->json([
            'message' => 'Status tagihan diperbarui',
            'data' => $invoice
        ]);
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return response()->json(['message' => 'Tagihan dihapus']);
    }
}

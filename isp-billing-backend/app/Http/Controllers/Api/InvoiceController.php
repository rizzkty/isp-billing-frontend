<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Customer;
use Illuminate\Http\Request;
use Carbon\Carbon;

class InvoiceController extends Controller
{
    public function index()
    {
        return response()->json(Invoice::with(['customer', 'package'])->latest()->get());
    }

    /**
     * Generate invoices for all active customers for the current month
     */
    public function generate(Request $request)
    {
        $month = $request->month ?? Carbon::now()->month;
        $year = $request->year ?? Carbon::now()->year;

        $customers = Customer::where('status', 'aktif')->with('package')->get();
        $count = 0;

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
                    'due_date' => Carbon::create($year, $month, 10), // Default tgl 10
                    'month' => $month,
                    'year' => $year,
                ]);
                $count++;
            }
        }

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

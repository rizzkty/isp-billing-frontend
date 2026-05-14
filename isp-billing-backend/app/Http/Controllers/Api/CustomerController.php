<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\AuditLog;
use Illuminate\Http\Request;

use App\Traits\DemoMockTrait;

class CustomerController extends Controller
{
    use DemoMockTrait;
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        if ($this->isDemoUser()) {
            return response()->json($this->getMockCustomers()['data']);
        }
        $customers = Customer::with('package')->latest()->get();
        return response()->json($customers);
    }

    /**
     * Generate a unique customer_id like NB-2026XXXX
     */
    private function generateCustomerId(): string
    {
        $year = date('Y');
        do {
            $id = 'NB-' . $year . str_pad(random_int(1, 9999), 4, '0', STR_PAD_LEFT);
        } while (Customer::where('customer_id', $id)->exists());
        return $id;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        if ($this->isDemoUser()) {
            return response()->json(['message' => 'Mode Demo: Data tidak dapat disimpan ke database.'], 403);
        }
        $validated = $request->validate([
            'customer_id'      => 'nullable|unique:customers',
            'package_id'       => 'nullable|exists:packages,id',
            'name'             => 'required|string|max:255',
            'phone'            => 'nullable|string|max:20',
            'email'            => 'nullable|email|max:255',
            'installation_date'=> 'nullable|date',
            'package_name'     => 'required|string|max:100',
            'ip_address'       => 'nullable|string|max:50',
            'address'          => 'nullable|string',
            'latitude'         => 'nullable|numeric',
            'longitude'        => 'nullable|numeric',
            'ont_brand'        => 'nullable|string|max:100',
            'router_brand'     => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
            'status'           => 'nullable|in:aktif,nonaktif,terisolir',
        ]);

        // Auto-generate customer_id if not provided or empty
        if (empty($validated['customer_id'])) {
            $validated['customer_id'] = $this->generateCustomerId();
        }

        // Set defaults
        $validated['status'] = $validated['status'] ?? 'aktif';
        $validated['installation_date'] = $validated['installation_date'] ?? now()->toDateString();

        // Convert empty string lat/lng to null
        if (isset($validated['latitude']) && $validated['latitude'] === '') {
            $validated['latitude'] = null;
        }
        if (isset($validated['longitude']) && $validated['longitude'] === '') {
            $validated['longitude'] = null;
        }

        $customer = Customer::create($validated);
        AuditLog::record('CREATE_CUSTOMER', "Menambah pelanggan: {$customer->name}");

        return response()->json([
            'message' => 'Pelanggan berhasil ditambahkan',
            'data'    => $customer
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Customer $customer)
    {
        return response()->json($customer);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Customer $customer)
    {
        if ($this->isDemoUser()) {
            return response()->json(['message' => 'Mode Demo: Data tidak dapat diubah.'], 403);
        }
        $validated = $request->validate([
            'package_id'       => 'nullable|exists:packages,id',
            'name'             => 'required|string|max:255',
            'phone'            => 'nullable|string|max:20',
            'email'            => 'nullable|email|max:255',
            'installation_date'=> 'nullable|date',
            'package_name'     => 'required|string|max:100',
            'ip_address'       => 'nullable|string|max:50',
            'address'          => 'nullable|string',
            'status'           => 'required|in:aktif,nonaktif,terisolir',
            'latitude'         => 'nullable|numeric',
            'longitude'        => 'nullable|numeric',
            'ont_brand'        => 'nullable|string|max:100',
            'router_brand'     => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
        ]);

        // Convert empty string lat/lng to null
        if (isset($validated['latitude']) && $validated['latitude'] === '') {
            $validated['latitude'] = null;
        }
        if (isset($validated['longitude']) && $validated['longitude'] === '') {
            $validated['longitude'] = null;
        }

        $customer->update($validated);
        AuditLog::record('UPDATE_CUSTOMER', "Mengubah data pelanggan: {$customer->name}");

        return response()->json([
            'message' => 'Data pelanggan berhasil diperbarui',
            'data'    => $customer
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        if ($this->isDemoUser()) {
            return response()->json(['message' => 'Mode Demo: Data tidak dapat dihapus.'], 403);
        }
        $name = $customer->name;
        $customer->delete();
        AuditLog::record('DELETE_CUSTOMER', "Menghapus pelanggan: {$name}");
        return response()->json([
            'message' => 'Pelanggan berhasil dihapus'
        ]);
    }
}

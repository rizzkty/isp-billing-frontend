<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $customers = Customer::with('package')->latest()->get();
        return response()->json($customers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|unique:customers',
            'package_id' => 'nullable|exists:packages,id',
            'name' => 'required',
            'address' => 'required',
            'phone' => 'required',
            'package_name' => 'required',
            'ip_address' => 'nullable',
            'installation_date' => 'required|date',
        ]);

        $customer = Customer::create($request->all());

        return response()->json([
            'message' => 'Pelanggan berhasil ditambahkan',
            'data' => $customer
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
        $request->validate([
            'package_id' => 'nullable|exists:packages,id',
            'name' => 'required',
            'address' => 'required',
            'phone' => 'required',
            'package_name' => 'required',
            'ip_address' => 'nullable',
            'status' => 'required|in:aktif,nonaktif,terisolir',
            'installation_date' => 'required|date',
        ]);

        $customer->update($request->all());

        return response()->json([
            'message' => 'Data pelanggan berhasil diperbarui',
            'data' => $customer
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer)
    {
        $customer->delete();
        return response()->json([
            'message' => 'Pelanggan berhasil dihapus'
        ]);
    }
}

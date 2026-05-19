<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Package;
use Illuminate\Http\Request;


class PackageController extends Controller
{


    public function index()
    {

        return response()->json(Package::all());
    }

    public function store(Request $request)
    {

        $request->validate([
            'name' => 'required',
            'speed' => 'required',
            'download' => 'required|integer',
            'upload' => 'required|integer',
            'profile' => 'required',
            'price' => 'required|numeric',
            'status' => 'required|in:Aktif,Tidak Aktif',
        ]);

        $package = Package::create($request->all());

        return response()->json([
            'message' => 'Paket berhasil dibuat',
            'data' => $package
        ], 201);
    }

    public function show(Package $package)
    {
        return response()->json($package);
    }

    public function update(Request $request, Package $package)
    {
        $request->validate([
            'name' => 'required',
            'speed' => 'required',
            'download' => 'required|integer',
            'upload' => 'required|integer',
            'profile' => 'required',
            'price' => 'required|numeric',
            'status' => 'required|in:Aktif,Tidak Aktif',
        ]);

        $package->update($request->all());

        return response()->json([
            'message' => 'Paket berhasil diperbarui',
            'data' => $package
        ]);
    }

    public function destroy(Package $package)
    {
        $package->delete();
        return response()->json([
            'message' => 'Paket berhasil dihapus'
        ]);
    }
}

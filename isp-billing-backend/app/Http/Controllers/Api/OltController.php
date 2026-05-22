<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OltDevice;
use Illuminate\Http\Request;

class OltController extends Controller
{
    public function index()
    {
        return response()->json(
            OltDevice::latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required',
            'ip_address' => 'required',
            'username' => 'nullable',
            'password' => 'nullable',
            'protocol' => 'required',
            'olt_type' => 'required',
            'polling_interval' => 'required|integer'
        ]);

        $olt = OltDevice::create(
            $validated
        );

        return response()->json([
            'message' => 'OLT berhasil ditambahkan',
            'data' => $olt
        ]);
    }
}
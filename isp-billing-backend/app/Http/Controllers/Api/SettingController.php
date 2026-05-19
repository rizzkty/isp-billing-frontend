<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;

class SettingController extends Controller
{

    // Fungsi untuk melempar data ke form React saat halaman dibuka
    public function getSettings()
    {
        $settings = Setting::pluck('value', 'key')->toArray();
        return response()->json($settings);
    }

    // Fungsi untuk menyimpan data dari form React ke MySQL
    public function store(Request $request)
    {
        $data = $request->all();

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan berhasil disimpan!'
        ]);
    }
}
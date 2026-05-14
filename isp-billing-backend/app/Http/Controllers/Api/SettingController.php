<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use App\Traits\DemoMockTrait;

class SettingController extends Controller
{
    use DemoMockTrait;

    // Fungsi untuk melempar data ke form React saat halaman dibuka
    public function getSettings()
    {
        if ($this->isDemoUser()) {
            return response()->json($this->getMockSettings());
        }
        $settings = Setting::pluck('value', 'key')->toArray();
        return response()->json($settings);
    }

    // Fungsi untuk menyimpan data dari form React ke MySQL
    public function store(Request $request)
    {
        if ($this->isDemoUser()) {
            return response()->json(['success' => false, 'message' => 'Mode Demo: Pengaturan tidak dapat diubah.'], 403);
        }
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
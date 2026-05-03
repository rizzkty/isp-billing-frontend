<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    // Mengambil semua pengaturan saat halaman React dibuka
    public function getSettings()
    {
        // Mengubah format database menjadi format JSON objek { key: value }
        $settings = Setting::pluck('value', 'key');
        return response()->json($settings);
    }

    // Menyimpan pengaturan saat tombol "Simpan" ditekan
    public function saveSettings(Request $request)
    {
        $data = $request->all();
        
        // Looping untuk menyimpan/memperbarui setiap input form
        foreach($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key], 
                ['value' => $value ?? '']
            );
        }

        return response()->json([
            'success' => true, 
            'message' => 'Pengaturan berhasil disimpan permanen!'
        ]);
    }
}
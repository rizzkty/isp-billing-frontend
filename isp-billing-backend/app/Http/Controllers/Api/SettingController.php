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
        
        // Masking password agar tidak bocor ke frontend
        $sensitiveKeys = ['apiPass', 'dbPass', 'radiusSecret'];
        foreach ($sensitiveKeys as $key) {
            if (isset($settings[$key]) && !empty($settings[$key])) {
                $settings[$key] = '********'; // Masking
            }
        }

        return response()->json($settings);
    }

    // Menyimpan pengaturan saat tombol "Simpan" ditekan
    public function saveSettings(Request $request)
    {
        // Daftar key yang diperbolehkan untuk disimpan demi keamanan
        $allowedKeys = [
            'apiIp', 'apiPort', 'apiUser', 'apiPass',
            'dbHost', 'dbPort', 'dbName', 'dbUser', 'dbPass',
            'radiusSecret', 'coaPort'
        ];

        $data = $request->only($allowedKeys);
        $sensitiveKeys = ['apiPass', 'dbPass', 'radiusSecret'];
        
        // Looping untuk menyimpan/memperbarui setiap input form
        foreach($data as $key => $value) {
            // Jika value kosong dan itu adalah sensitive key, jangan diupdate (berarti tidak diubah)
            if (in_array($key, $sensitiveKeys) && empty($value)) {
                continue;
            }
            
            // Jika ini password/secret, maka kita enkripsi
            if (in_array($key, $sensitiveKeys) && !empty($value)) {
                // Jika value-nya bukan '********' (berarti user input password baru)
                if ($value !== '********') {
                    $value = \Illuminate\Support\Facades\Crypt::encryptString($value);
                } else {
                    // Jika value-nya '********', abaikan update untuk key ini
                    continue;
                }
            }

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
<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        $settings = Setting::whereIn('key', ['waApiKey', 'waBaseUrl'])
                           ->pluck('value', 'key');
        
        $this->apiKey = $settings->get('waApiKey', env('WA_API_KEY'));
        $this->baseUrl = $settings->get('waBaseUrl', 'https://api.fonnte.com/send');
    }

    /**
     * Kirim pesan WhatsApp
     * 
     * @param string $to Nomor tujuan (format 628xxx)
     * @param string $message Isi pesan
     * @return bool
     */
    public function sendMessage($to, $message)
    {
        if (empty($this->apiKey)) {
            Log::warning("WhatsApp: API Key belum dikonfigurasi. Pesan tidak terkirim: $message");
            return false;
        }

        // Normalisasi nomor telepon ke format internasional (62)
        $to = $this->formatNumber($to);

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->apiKey,
            ])->post($this->baseUrl, [
                'target' => $to,
                'message' => $message,
            ]);

            if ($response->successful()) {
                Log::info("WhatsApp: Pesan berhasil terkirim ke $to");
                return true;
            }

            Log::error("WhatsApp: Gagal mengirim pesan ke $to. Response: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("WhatsApp: Exception saat mengirim pesan ke $to: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Format nomor telepon ke standar internasional
     */
    protected function formatNumber($number)
    {
        $number = preg_replace('/[^0-9]/', '', $number);
        
        if (str_starts_with($number, '0')) {
            $number = '62' . substr($number, 1);
        } elseif (str_starts_with($number, '8')) {
            $number = '62' . $number;
        }

        return $number;
    }
}

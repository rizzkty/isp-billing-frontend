<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    protected $provider;
    protected $fonnteApiKey;
    protected $fonnteBaseUrl;
    protected $metaAccessToken;
    protected $metaPhoneId;
    protected $metaTemplateName;

    public function __construct()
    {
        $settings = Setting::whereIn('key', [
            'waProvider',
            'waApiKey',
            'waBaseUrl',
            'waMetaAccessToken',
            'waMetaPhoneId',
            'waMetaTemplateName'
        ])->pluck('value', 'key');
        
        $this->provider = $settings->get('waProvider', env('WA_PROVIDER', 'fonnte'));
        
        // Fonnte configurations
        $this->fonnteApiKey = $settings->get('waApiKey', env('WA_API_KEY'));
        $this->fonnteBaseUrl = $settings->get('waBaseUrl', 'https://api.fonnte.com/send');
        
        // Meta Cloud API configurations
        $this->metaAccessToken = $settings->get('waMetaAccessToken', env('WA_META_ACCESS_TOKEN'));
        $this->metaPhoneId = $settings->get('waMetaPhoneId', env('WA_META_PHONE_NUMBER_ID'));
        $this->metaTemplateName = $settings->get('waMetaTemplateName', env('WA_META_TEMPLATE_NAME'));
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
        // Normalisasi nomor telepon ke format internasional (62)
        $to = $this->formatNumber($to);

        if ($this->provider === 'meta') {
            return $this->sendMetaMessage($to, $message);
        }

        return $this->sendFonnteMessage($to, $message);
    }

    /**
     * Kirim pesan via Fonnte Gateway
     */
    protected function sendFonnteMessage($to, $message)
    {
        if (empty($this->fonnteApiKey)) {
            Log::warning("WhatsApp Fonnte: API Key belum dikonfigurasi. Pesan tidak terkirim: $message");
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $this->fonnteApiKey,
            ])->post($this->fonnteBaseUrl, [
                'target' => $to,
                'message' => $message,
            ]);

            if ($response->successful()) {
                Log::info("WhatsApp Fonnte: Pesan berhasil terkirim ke $to");
                return true;
            }

            Log::error("WhatsApp Fonnte: Gagal mengirim pesan ke $to. Response: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("WhatsApp Fonnte: Exception saat mengirim pesan ke $to: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Kirim pesan via Meta WhatsApp Cloud API
     */
    protected function sendMetaMessage($to, $message)
    {
        if (empty($this->metaAccessToken) || empty($this->metaPhoneId)) {
            Log::warning("WhatsApp Meta: Access Token atau Phone Number ID belum dikonfigurasi. Pesan tidak terkirim: $message");
            return false;
        }

        $url = "https://graph.facebook.com/v20.0/{$this->metaPhoneId}/messages";

        try {
            $payload = [
                'messaging_product' => 'whatsapp',
                'to' => $to,
            ];

            // Jika mengonfigurasi template untuk membungkus pesan teks bebas (Template Hack)
            if (!empty($this->metaTemplateName)) {
                $payload['type'] = 'template';
                
                $components = [
                    [
                        'type' => 'body',
                        'parameters' => [
                            [
                                'type' => 'text',
                                'text' => $message
                            ]
                        ]
                    ]
                ];

                // Cek apakah pesan berisi link tautan portal
                $detectedLink = $this->extractLink($message);
                if ($detectedLink) {
                    $parsedUrl = parse_url($detectedLink);
                    $pathAndQuery = ($parsedUrl['path'] ?? '') . (isset($parsedUrl['query']) ? '?' . $parsedUrl['query'] : '');
                    $pathAndQuery = ltrim($pathAndQuery, '/'); // hilangkan slash di awal path jika ada

                    if (!empty($pathAndQuery)) {
                        // Tambahkan komponen button untuk custom dinamis URL di Meta
                        $components[] = [
                            'type' => 'button',
                            'sub_type' => 'url',
                            'index' => '0',
                            'parameters' => [
                                [
                                    'type' => 'text',
                                    'text' => $pathAndQuery
                                ]
                            ]
                        ];

                        // Hapus link teks asli dari isi pesan agar tidak dobel/mengotori tampilan
                        $messageWithoutLink = str_replace($detectedLink, '', $message);
                        // Bersihkan spasi berlebih atau baris baru di akhir setelah penghapusan link
                        $messageWithoutLink = preg_replace('/\s+👉\s*$/', '', $messageWithoutLink);
                        $messageWithoutLink = trim($messageWithoutLink);

                        $components[0]['parameters'][0]['text'] = $messageWithoutLink;
                    }
                }

                $payload['template'] = [
                    'name' => $this->metaTemplateName,
                    'language' => [
                        'code' => 'id' // Default bahasa Indonesia
                    ],
                    'components' => $components
                ];
            } else {
                // Teks bebas biasa (hanya bekerja jika ada sesi 24 jam terbuka)
                $payload['type'] = 'text';
                $payload['text'] = [
                    'body' => $message
                ];
            }

            $response = Http::withToken($this->metaAccessToken)
                            ->post($url, $payload);

            if ($response->successful()) {
                Log::info("WhatsApp Meta: Pesan berhasil terkirim ke $to");
                return true;
            }

            Log::error("WhatsApp Meta: Gagal mengirim pesan ke $to. Status: " . $response->status() . " Response: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("WhatsApp Meta: Exception saat mengirim pesan ke $to: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Cari URL link di dalam pesan
     */
    protected function extractLink($message)
    {
        if (preg_match('/https?:\/\/[^\s]+/', $message, $matches)) {
            return $matches[0];
        }
        return null;
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

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

    // Uji coba kirim pesan WhatsApp
    public function testWhatsApp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'message' => 'required|string',
        ]);

        $waService = new \App\Services\WhatsAppService();
        $success = $waService->sendMessage($request->phone, $request->message);

        if ($success) {
            return response()->json(['success' => true, 'message' => 'Pesan uji coba WA berhasil dikirim!']);
        }

        return response()->json(['success' => false, 'message' => 'Gagal mengirim pesan uji coba WA. Periksa log atau kredensial Anda.'], 500);
    }

    // Uji coba kirim email
    public function testEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'subject' => 'required|string',
            'message' => 'required|string',
        ]);

        try {
            $settings = Setting::whereIn('key', [
                'mailDriver',
                'mailHost',
                'mailPort',
                'mailUsername',
                'mailPassword',
                'mailEncryption',
                'mailFromAddress',
                'mailFromName'
            ])->pluck('value', 'key');

            if ($settings->isNotEmpty()) {
                config([
                    'mail.default' => $settings->get('mailDriver', env('MAIL_MAILER', 'log')),
                    'mail.mailers.smtp.host' => $settings->get('mailHost', env('MAIL_HOST', '127.0.0.1')),
                    'mail.mailers.smtp.port' => (int) $settings->get('mailPort', env('MAIL_PORT', 2525)),
                    'mail.mailers.smtp.username' => $settings->get('mailUsername', env('MAIL_USERNAME')),
                    'mail.mailers.smtp.password' => $settings->get('mailPassword', env('MAIL_PASSWORD')),
                    'mail.mailers.smtp.encryption' => $settings->get('mailEncryption', env('MAIL_ENCRYPTION')),
                    'mail.from.address' => $settings->get('mailFromAddress', env('MAIL_FROM_ADDRESS', 'hello@example.com')),
                    'mail.from.name' => $settings->get('mailFromName', env('MAIL_FROM_NAME', 'NetBilling ISP')),
                ]);
            }

            $dummyCustomer = new \App\Models\Customer([
                'name' => 'Pelanggan Uji Coba',
                'email' => $request->email,
            ]);

            \Illuminate\Support\Facades\Mail::to($request->email)->send(new \App\Mail\CustomerNotificationMail(
                $request->subject,
                $request->message,
                $dummyCustomer
            ));

            return response()->json(['success' => true, 'message' => 'Email uji coba berhasil dikirim!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengirim email uji coba: ' . $e->getMessage()], 500);
        }
    }
}
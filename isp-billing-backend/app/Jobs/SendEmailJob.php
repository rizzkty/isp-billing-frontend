<?php

namespace App\Jobs;

use App\Mail\CustomerNotificationMail;
use App\Models\Customer;
use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $toEmail;
    protected $subject;
    protected $message;
    protected $customer;

    /**
     * Create a new job instance.
     */
    public function __construct(string $toEmail, string $subject, string $message, Customer $customer)
    {
        $this->toEmail = $toEmail;
        $this->subject = $subject;
        $this->message = $message;
        $this->customer = $customer;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Load dynamic SMTP settings from database
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

            Mail::to($this->toEmail)->send(new CustomerNotificationMail(
                $this->subject,
                $this->message,
                $this->customer
            ));

            Log::info("Email: Berhasil mengirim email ke {$this->toEmail}");
        } catch (\Exception $e) {
            Log::error("Email: Gagal mengirim email ke {$this->toEmail}. Error: " . $e->getMessage());
        }
    }
}

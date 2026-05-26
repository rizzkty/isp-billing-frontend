<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Models\Customer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessBroadcastNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $notification;

    /**
     * Create a new job instance.
     */
    public function __construct(Notification $notification)
    {
        $this->notification = $notification;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Tentukan target penerima
        if ($this->notification->type === 'broadcast') {
            $customers = Customer::where('status', 'aktif')->get();
        } else {
            $customers = Customer::where('id', $this->notification->customer_id)->get();
        }

        foreach ($customers as $customer) {
            // Parsing variabel dinamis
            $parsedMessage = $this->substituteVariables($this->notification->message, $customer);
            $parsedTitle   = $this->substituteVariables($this->notification->title, $customer);

            // Dispatch SendWhatsAppJob untuk setiap pelanggan
            if (($this->notification->channel === 'wa' || $this->notification->channel === 'both') && !empty($customer->phone)) {
                SendWhatsAppJob::dispatch($customer->phone, $parsedMessage);
            }
            
            // Dispatch SendEmailJob untuk setiap pelanggan
            if (($this->notification->channel === 'email' || $this->notification->channel === 'both') && !empty($customer->email)) {
                SendEmailJob::dispatch($customer->email, $parsedTitle, $parsedMessage, $customer);
            }
        }
    }

    /**
     * Menerjemahkan placeholder variabel menjadi data riil pelanggan
     */
    protected function substituteVariables(string $text, Customer $customer): string
    {
        $packagePrice = 'Rp 150.000';
        if ($customer->package) {
            $packagePrice = 'Rp ' . number_format($customer->package->price, 0, ',', '.');
        } else {
            $lastInvoice = $customer->invoices()->latest()->first();
            if ($lastInvoice) {
                $packagePrice = 'Rp ' . number_format($lastInvoice->total, 0, ',', '.');
            }
        }

        $lastInvoice = $customer->invoices()->latest()->first();
        $dueDate = $lastInvoice ? date('d M Y', strtotime($lastInvoice->due_date)) : '10 ' . date('M Y');

        // Generate magic link token jika template menggunakan placeholder {{link_portal}}
        $magicLink = '';
        if (str_contains($text, '{{link_portal}}')) {
            $rawToken = \Illuminate\Support\Str::random(48);
            \App\Models\CustomerToken::create([
                'customer_id' => $customer->id,
                'token'       => $rawToken,
                'type'        => 'magic_link',
                'expires_at'  => now()->addDays(30),
            ]);
            $magicLink = env('APP_FRONTEND_URL', 'http://localhost:5173')
                       . "/portal/verify?token={$rawToken}&redirect=/portal/invoices";
        }

        return str_replace(
            ['{{nama}}', '{{paket}}', '{{nominal}}', '{{jatuh_tempo}}', '{{link_portal}}'],
            [$customer->name, $customer->package_name ?? 'Internet Package', $packagePrice, $dueDate, $magicLink],
            $text
        );
    }
}

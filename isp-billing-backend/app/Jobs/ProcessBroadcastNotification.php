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
            $customers = Customer::where('status', 'aktif')->whereNotNull('phone')->get();
        } else {
            $customers = Customer::where('id', $this->notification->customer_id)->whereNotNull('phone')->get();
        }

        foreach ($customers as $customer) {
            // Dispatch SendWhatsAppJob untuk setiap pelanggan
            if ($this->notification->channel === 'wa' || $this->notification->channel === 'both') {
                SendWhatsAppJob::dispatch($customer->phone, $this->notification->message);
            }
            
            // Note: Email bisa ditambahkan di sini jika sudah ada SendEmailJob
        }
    }
}

<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class RunAutoIsolirJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Queue: Memulai proses Auto-Isolir dari background job.");
        
        try {
            Artisan::call('isp:isolir', ['--manual' => true]);
            $output = Artisan::output();
            
            Log::info("Queue: Proses Auto-Isolir selesai. Output: " . $output);
        } catch (\Exception $e) {
            Log::error("Queue: Gagal menjalankan Auto-Isolir: " . $e->getMessage());
        }
    }
}

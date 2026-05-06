<?php

namespace App\Jobs;

use App\Models\AuditLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RecordAuditLog implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $userId;
    protected $action;
    protected $detail;
    protected $ipAddress;

    /**
     * Create a new job instance.
     */
    public function __construct($userId, $action, $detail, $ipAddress)
    {
        $this->userId = $userId;
        $this->action = $action;
        $this->detail = $detail;
        $this->ipAddress = $ipAddress;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        AuditLog::create([
            'user_id' => $this->userId,
            'action' => $this->action,
            'detail' => $this->detail,
            'ip_address' => $this->ipAddress,
        ]);
    }
}

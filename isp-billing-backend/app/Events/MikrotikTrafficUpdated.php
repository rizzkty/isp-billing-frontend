<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

// ShouldBroadcastNow membuat data langsung dikirim tanpa antrean
class MikrotikTrafficUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $trafficData;

    public function __construct($trafficData)
    {
        $this->trafficData = $trafficData;
    }

    public function broadcastOn()
    {
        // Menyiarkan di frekuensi channel bernama 'noc-monitoring'
        return new Channel('noc-monitoring');
    }

    public function broadcastAs()
    {
        return 'traffic.updated';
    }
}
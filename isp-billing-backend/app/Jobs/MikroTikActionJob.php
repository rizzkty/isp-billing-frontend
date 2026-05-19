<?php

namespace App\Jobs;

use App\Models\Setting;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use RouterOS\Client;
use RouterOS\Query;
use Illuminate\Support\Facades\Log;

class MikroTikActionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $action; // 'add' or 'remove'
    protected $ip;
    protected $name;

    /**
     * Create a new job instance.
     */
    public function __construct($action, $ip, $name)
    {
        $this->action = $action;
        $this->ip = $ip;
        $this->name = $name;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (empty($this->ip)) return;

        $settings = Setting::whereIn('key', ['apiIp', 'apiPort', 'apiUser', 'apiPass'])
                           ->pluck('value', 'key');
                           
        $apiIp   = $settings->get('apiIp');
        $apiUser = $settings->get('apiUser');

        if (empty($apiIp) || empty($apiUser)) {
            Log::info("[Bypass] MikroTik Job: {$this->action} IP {$this->ip} ({$this->name}) - MikroTik API not configured.");
            return;
        }

        try {
            $apiPassRaw = $settings->get('apiPass', '');
            try {
                $apiPass = !empty($apiPassRaw) ? \Illuminate\Support\Facades\Crypt::decryptString($apiPassRaw) : '';
            } catch (\Exception $e) {
                $apiPass = $apiPassRaw;
            }

            $client = new Client([
                'host'    => $apiIp,
                'user'    => $apiUser,
                'pass'    => $apiPass,
                'port'    => (int) $settings->get('apiPort', '8728'),
                'timeout' => 5,
            ]);

            if ($this->action === 'add') {
                $this->addToIsolir($client);
            } else {
                $this->removeFromIsolir($client);
            }

        } catch (\Exception $e) {
            Log::error("MikroTik Job Error: " . $e->getMessage());
        }
    }

    protected function addToIsolir($client)
    {
        // Cek apakah sudah ada
        $query = (new Query('/ip/firewall/address-list/print'))
                    ->where('address', $this->ip)
                    ->where('list', 'ISOLIR_LIST');
        
        $existing = $client->query($query)->read();

        if (empty($existing)) {
            $addQuery = (new Query('/ip/firewall/address-list/add'))
                            ->equal('address', $this->ip)
                            ->equal('list', 'ISOLIR_LIST')
                            ->equal('comment', 'Auto-Isolir: ' . $this->name);
            $client->query($addQuery)->read();
        }
    }

    protected function removeFromIsolir($client)
    {
        $query = (new Query('/ip/firewall/address-list/print'))
                    ->where('address', $this->ip)
                    ->where('list', 'ISOLIR_LIST');
        
        $entries = $client->query($query)->read();

        if (!empty($entries)) {
            foreach ($entries as $entry) {
                $removeQuery = (new Query('/ip/firewall/address-list/remove'))
                                ->equal('.id', $entry['.id']);
                $client->query($removeQuery)->read();
            }
        }
    }
}

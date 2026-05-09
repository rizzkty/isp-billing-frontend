<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class EncryptExistingData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'security:encrypt-data {--table=customers : The table to encrypt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Encrypt existing plaintext data in the database for specified fields';

    /**
     * Fields to encrypt per table
     */
    protected $encryptableFields = [
        'customers' => ['phone', 'email', 'address'],
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $table = $this->option('table');

        if (!array_key_exists($table, $this->encryptableFields)) {
            $this->error("Table '{$table}' is not configured for encryption.");
            return 1;
        }

        $fields = $this->encryptableFields[$table];
        
        $this->info("Starting encryption for table: {$table}");
        $this->info("Fields to encrypt: " . implode(', ', $fields));

        if (!$this->confirm('Have you backed up your database? This action modifies existing data and could be destructive if it fails.')) {
            $this->warn('Aborted. Please backup your database first.');
            return 0;
        }

        $records = DB::table($table)->get();
        $bar = $this->output->createProgressBar(count($records));
        $encryptedCount = 0;
        $skippedCount = 0;

        foreach ($records as $record) {
            $updates = [];
            
            foreach ($fields as $field) {
                $value = $record->{$field};
                
                if (empty($value)) {
                    continue;
                }

                // Check if already encrypted (Laravel's encrypted string usually starts with a large base64 payload containing iv, value, mac)
                // A simple heuristic: if it's valid JSON containing 'iv', 'value', 'mac' after base64 decode, it's likely encrypted
                $isEncrypted = false;
                try {
                    $decoded = base64_decode($value);
                    if ($decoded) {
                        $json = json_decode($decoded, true);
                        if (is_array($json) && isset($json['iv']) && isset($json['value']) && isset($json['mac'])) {
                            $isEncrypted = true;
                        }
                    }
                } catch (\Exception $e) {
                    // Not encrypted
                }

                if (!$isEncrypted) {
                    $updates[$field] = Crypt::encryptString($value);
                }
            }

            if (!empty($updates)) {
                DB::table($table)->where('id', $record->id)->update($updates);
                $encryptedCount++;
            } else {
                $skippedCount++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        
        $this->info("Encryption complete!");
        $this->line("Records encrypted: {$encryptedCount}");
        $this->line("Records skipped (already encrypted or empty): {$skippedCount}");

        return 0;
    }
}

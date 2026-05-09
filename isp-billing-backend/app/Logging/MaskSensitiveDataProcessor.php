<?php

namespace App\Logging;

use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

class MaskSensitiveDataProcessor implements ProcessorInterface
{
    /**
     * Fields to mask in the logs
     */
    protected array $sensitiveFields = [
        'password',
        'password_confirmation',
        'token',
        'api_token',
        'phone',
        'email',
        'credit_card',
    ];

    public function __invoke(LogRecord $record): LogRecord
    {
        $context = $record->context;
        
        if (!empty($context)) {
            $record = $record->with(context: $this->maskArray($context));
        }

        return $record;
    }

    protected function maskArray(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->maskArray($value);
            } elseif (in_array(strtolower((string)$key), $this->sensitiveFields)) {
                if (is_string($value) && !empty($value)) {
                    // Tampilkan 2 huruf pertama jika panjang string > 4, sisanya mask
                    if (strlen($value) > 4) {
                        $data[$key] = substr($value, 0, 2) . str_repeat('*', strlen($value) - 2);
                    } else {
                        $data[$key] = '***';
                    }
                } else {
                    $data[$key] = '***';
                }
            }
        }

        return $data;
    }
}

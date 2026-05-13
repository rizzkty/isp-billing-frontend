<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'customer_id',
        'package_id',
        'amount',
        'status',
        'due_date',
        'month',
        'year',
        'notes',
        // Xendit fields
        'xendit_invoice_id',
        'xendit_payment_url',
        'xendit_status',
        'xendit_paid_at',
        'payment_method',
        'xendit_expires_at',
    ];

    protected $casts = [
        'due_date'          => 'date',
        'xendit_paid_at'    => 'datetime',
        'xendit_expires_at' => 'datetime',
    ];

    /**
     * Cek apakah payment link Xendit masih aktif dan belum expired
     */
    public function hasActivePaymentLink(): bool
    {
        return $this->xendit_payment_url !== null
            && $this->xendit_expires_at !== null
            && $this->xendit_expires_at->isFuture()
            && $this->xendit_status === 'PENDING';
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }
}

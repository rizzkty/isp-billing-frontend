<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerToken extends Model
{
    protected $fillable = [
        'customer_id',
        'token',
        'type',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at'    => 'datetime',
    ];

    /**
     * Relasi ke Customer
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Cek apakah token masih valid (belum expired dan belum dipakai)
     */
    public function isValid(): bool
    {
        return $this->used_at === null && $this->expires_at->isFuture();
    }

    /**
     * Tandai token sudah digunakan
     */
    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }

    /**
     * Scope: hanya token yang masih berlaku
     */
    public function scopeValid($query)
    {
        return $query->whereNull('used_at')->where('expires_at', '>', now());
    }
}

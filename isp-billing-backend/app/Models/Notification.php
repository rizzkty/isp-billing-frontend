<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'title', 'message', 'type', 'channel', 'sent_by', 'customer_id', 'recipient_count'
    ];

    public function sender()
    {
        return $this->belongsTo(\App\Models\User::class, 'sent_by');
    }

    public function customer()
    {
        return $this->belongsTo(\App\Models\Customer::class);
    }
}

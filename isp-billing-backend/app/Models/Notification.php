<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'title', 'message', 'type', 'sent_by', 'recipient_count'
    ];

    public function sender()
    {
        return $this->belongsTo(\App\Models\User::class, 'sent_by');
    }
}

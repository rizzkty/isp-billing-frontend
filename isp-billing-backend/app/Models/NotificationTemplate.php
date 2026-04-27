<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    protected $fillable = ['name', 'title', 'message', 'is_default'];

    protected $casts = ['is_default' => 'boolean'];
}

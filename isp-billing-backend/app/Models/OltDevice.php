<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OltDevice extends Model
{
     protected $fillable = [
        'name',
        'ip_address',
        'username',
        'password',
        'protocol',
        'snmp_community',
        'olt_type',
        'polling_interval',
        'status'
    ];

    protected $hidden = [
        'password'
    ];
}

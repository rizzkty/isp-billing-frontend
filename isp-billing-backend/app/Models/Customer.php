<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'customer_id',
        'name',
        'address',
        'phone',
        'package_name',
        'ip_address',
        'status',
        'installation_date',
    ];
}

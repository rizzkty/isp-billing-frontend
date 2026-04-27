<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'customer_id',
        'package_id',
        'name',
        'address',
        'phone',
        'email',
        'package_name',
        'ip_address',
        'status',
        'installation_date',
        'latitude',
        'longitude',
        'ont_brand',
        'router_brand',
        'notes',
    ];

    public function package()
    {
        return $this->belongsTo(Package::class);
    }
}

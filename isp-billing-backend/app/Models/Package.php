<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = [
        'name',
        'speed',
        'download',
        'upload',
        'profile',
        'price',
        'status',
        'description',
    ];
}

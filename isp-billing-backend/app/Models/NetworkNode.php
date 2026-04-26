<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NetworkNode extends Model
{
    protected $fillable = ['name', 'type', 'lat', 'lng', 'description'];
}

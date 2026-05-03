<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // <- BARIS INI YANG HILANG TADI
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'value'];
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = ['user_id', 'action', 'detail', 'ip_address'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper: catat aktivitas dari mana saja
     */
    public static function record($action, $detail = null, $request = null)
    {
        return static::create([
            'user_id'    => auth()->id(),
            'action'     => $action,
            'detail'     => $detail,
            'ip_address' => $request?->ip() ?? request()->ip(),
        ]);
    }
}

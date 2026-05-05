<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NetworkNode extends Model
{
    protected $fillable = [
        'name', 'type', 'lat', 'lng', 'description',
        'status', 'parent_id', 'customer_id', 'cable_color', 'port', 'max_ports',
    ];

    public function parent()
    {
        return $this->belongsTo(NetworkNode::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(NetworkNode::class, 'parent_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function edgesFrom()
    {
        return $this->hasMany(NetworkEdge::class, 'from_node_id');
    }

    public function edgesTo()
    {
        return $this->hasMany(NetworkEdge::class, 'to_node_id');
    }
}

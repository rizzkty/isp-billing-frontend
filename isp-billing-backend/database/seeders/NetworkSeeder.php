<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class NetworkSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $n1 = \App\Models\NetworkNode::create([
            'name' => 'OLT PUSAT',
            'type' => 'OLT',
            'lat' => -8.1724,
            'lng' => 113.6995,
            'description' => 'Router Core ISP'
        ]);

        $n2 = \App\Models\NetworkNode::create([
            'name' => 'ODP MASTRIP 1',
            'type' => 'ODP',
            'lat' => -8.1685,
            'lng' => 113.7025,
            'description' => 'Area Mastrip Blok A'
        ]);

        $n3 = \App\Models\NetworkNode::create([
            'name' => 'ODP MASTRIP 2',
            'type' => 'ODP',
            'lat' => -8.1670,
            'lng' => 113.6950,
            'description' => 'Area Mastrip Blok B'
        ]);

        \App\Models\NetworkEdge::create([
            'from_node_id' => $n1->id,
            'to_node_id' => $n2->id,
            'type' => 'Backbone'
        ]);

        \App\Models\NetworkEdge::create([
            'from_node_id' => $n2->id,
            'to_node_id' => $n3->id,
            'type' => 'Distribution'
        ]);
    }
}

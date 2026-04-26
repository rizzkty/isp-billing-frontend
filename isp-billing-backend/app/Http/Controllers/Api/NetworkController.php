<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NetworkNode;
use App\Models\NetworkEdge;
use Illuminate\Http\Request;

class NetworkController extends Controller
{
    public function index()
    {
        return response()->json([
            'nodes' => NetworkNode::all(),
            'edges' => NetworkEdge::all()
        ]);
    }

    public function storeNode(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'type' => 'required|in:OLT,ODP,Pole',
            'lat' => 'required|numeric',
            'lng' => 'required|numeric',
        ]);

        $node = NetworkNode::create($request->all());

        return response()->json([
            'message' => 'Titik jaringan berhasil ditambahkan',
            'data' => $node
        ], 201);
    }

    public function storeEdge(Request $request)
    {
        $request->validate([
            'from_node_id' => 'required|exists:network_nodes,id',
            'to_node_id' => 'required|exists:network_nodes,id',
            'type' => 'required|in:Backbone,Distribution',
        ]);

        $edge = NetworkEdge::create($request->all());

        return response()->json([
            'message' => 'Jalur kabel berhasil ditambahkan',
            'data' => $edge
        ], 201);
    }

    public function destroyNode(NetworkNode $node)
    {
        $node->delete();
        return response()->json(['message' => 'Titik jaringan dihapus']);
    }
}

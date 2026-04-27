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
            'nodes' => NetworkNode::with('customer:id,name,package_name')->get(),
            'edges' => NetworkEdge::all()
        ]);
    }

    public function storeNode(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'type'        => 'required|in:server,odc,odp,customer',
            'lat'         => 'required|numeric',
            'lng'         => 'required|numeric',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:aktif,los,offline',
            'parent_id'   => 'nullable|exists:network_nodes,id',
            'customer_id' => 'nullable|exists:customers,id',
            'cable_color' => 'nullable|string|max:20',
            'port'        => 'nullable|string|max:20',
        ]);

        $validated['status'] = $validated['status'] ?? 'aktif';

        $node = NetworkNode::create($validated);

        // Auto-create edge jika parent_id diisi
        if (!empty($validated['parent_id'])) {
            $edgeType = in_array($node->type, ['server', 'odc']) ? 'Backbone' : 'Distribution';
            NetworkEdge::create([
                'from_node_id' => $validated['parent_id'],
                'to_node_id'   => $node->id,
                'type'         => $edgeType,
                'cable_color'  => $validated['cable_color'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Titik jaringan berhasil ditambahkan',
            'data'    => $node->load('customer:id,name,package_name')
        ], 201);
    }

    public function updateNode(Request $request, NetworkNode $node)
    {
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'lat'         => 'sometimes|numeric',
            'lng'         => 'sometimes|numeric',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:aktif,los,offline',
            'parent_id'   => 'nullable|exists:network_nodes,id',
            'customer_id' => 'nullable|exists:customers,id',
            'cable_color' => 'nullable|string|max:20',
            'port'        => 'nullable|string|max:20',
        ]);

        $oldParent = $node->parent_id;
        $node->update($validated);

        // Jika parent berubah, update edge
        if (array_key_exists('parent_id', $validated) && $validated['parent_id'] !== $oldParent) {
            // Hapus edge lama ke node ini
            NetworkEdge::where('to_node_id', $node->id)->delete();

            // Buat edge baru jika parent baru ada
            if (!empty($validated['parent_id'])) {
                $edgeType = in_array($node->type, ['server', 'odc']) ? 'Backbone' : 'Distribution';
                NetworkEdge::create([
                    'from_node_id' => $validated['parent_id'],
                    'to_node_id'   => $node->id,
                    'type'         => $edgeType,
                    'cable_color'  => $validated['cable_color'] ?? $node->cable_color,
                ]);
            }
        }

        return response()->json([
            'message' => 'Titik jaringan berhasil diperbarui',
            'data'    => $node->fresh()->load('customer:id,name,package_name')
        ]);
    }

    public function storeEdge(Request $request)
    {
        $validated = $request->validate([
            'from_node_id' => 'required|exists:network_nodes,id',
            'to_node_id'   => 'required|exists:network_nodes,id',
            'type'         => 'required|in:Backbone,Distribution',
            'cable_color'  => 'nullable|string|max:20',
            'label'        => 'nullable|string|max:255',
        ]);

        $edge = NetworkEdge::create($validated);

        return response()->json([
            'message' => 'Jalur kabel berhasil ditambahkan',
            'data'    => $edge
        ], 201);
    }

    public function destroyNode(NetworkNode $node)
    {
        $node->delete();
        return response()->json(['message' => 'Titik jaringan dihapus']);
    }
}

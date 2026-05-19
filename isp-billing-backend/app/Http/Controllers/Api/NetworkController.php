<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NetworkNode;
use App\Models\NetworkEdge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // Wajib ditambahkan untuk Transaction
use RouterOS\Client;
use RouterOS\Query;

class NetworkController extends Controller
{

    public function index()
    {

        return response()->json([
            'nodes' => NetworkNode::with('customer:id,name,package_name')->get(),
            'edges' => NetworkEdge::all()
        ]);
    }

public function testMikrotik(Request $request)
    {
        $request->validate([
            'apiIp' => 'required',
            'apiPort' => 'required',
            'apiUser' => 'required',
            // apiPass bisa kosong
        ]);

        try {
            $client = new Client([
                'host' => $request->apiIp,
                'user' => $request->apiUser,
                'pass' => $request->apiPass ?? '',
                'port' => (int) $request->apiPort,
                'timeout' => 5 // Timeout 5 detik agar tidak hang
            ]);

            // Jika login sukses, tarik data Identity router
            $query = new Query('/system/identity/print');
            $response = $client->query($query)->read();
            
            $routerName = $response[0]['name'] ?? 'Unknown Router';

            return response()->json([
                'success' => true,
                'identity' => $routerName
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Koneksi Ditolak: ' . $e->getMessage()
            ], 500);
        }
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

        // Mulai perlindungan data ganda (Transaction)
        DB::beginTransaction();
        try {
            $node = NetworkNode::create($validated);

            // Auto-create edge (kabel) jika parent_id diisi
            if (!empty($validated['parent_id'])) {
                $edgeType = in_array($node->type, ['server', 'odc']) ? 'Backbone' : 'Distribution';
                NetworkEdge::create([
                    'from_node_id' => $validated['parent_id'],
                    'to_node_id'   => $node->id,
                    'type'         => $edgeType,
                    'cable_color'  => $validated['cable_color'] ?? null,
                ]);
            }

            // Simpan permanen ke database jika semua step di atas berhasil
            DB::commit();

            return response()->json([
                'message' => 'Titik jaringan berhasil ditambahkan',
                'data'    => $node->load('customer:id,name,package_name')
            ], 201);

        } catch (\Exception $e) {
            // Batalkan semua proses insert jika ada error di tengah jalan
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menyimpan data: ' . $e->getMessage()
            ], 500);
        }
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

        DB::beginTransaction();
        try {
            $node->update($validated);

            // Jika parent (induk) berubah, hapus kabel lama dan buat kabel baru
            if (array_key_exists('parent_id', $validated) && $validated['parent_id'] !== $oldParent) {
                
                // Hapus edge (kabel) lama yang mengarah ke node ini
                NetworkEdge::where('to_node_id', $node->id)->delete();

                // Buat edge (kabel) baru jika parent baru diisi
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

            DB::commit();

            return response()->json([
                'message' => 'Titik jaringan berhasil diperbarui',
                'data'    => $node->fresh()->load('customer:id,name,package_name')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal memperbarui data: ' . $e->getMessage()
            ], 500);
        }
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
            'message' => 'Jalur kabel manual berhasil ditambahkan',
            'data'    => $edge
        ], 201);
    }

    public function destroyNode(NetworkNode $node)
    {
        DB::beginTransaction();
        try {
            // Hapus semua kabel yang menyambung (masuk atau keluar) dari titik ini
            NetworkEdge::where('from_node_id', $node->id)
                       ->orWhere('to_node_id', $node->id)
                       ->delete();

            // Baru setelah itu hapus titik koordinatnya
            $node->delete();

            DB::commit();

            return response()->json([
                'message' => 'Titik jaringan beserta jalur kabel terkait berhasil dihapus bersih'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menghapus data: ' . $e->getMessage()
            ], 500);
        }
    }
}
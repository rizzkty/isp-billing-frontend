<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function index()
    {

        return response()->json(
            Ticket::with(['customer:id,name', 'assignedTo:id,name'])
                ->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string',
            'description' => 'required|string',
            'priority'    => 'required|in:low,medium,high,urgent',
            'customer_id' => 'nullable|exists:customers,id',
            'assigned_to' => 'nullable|exists:users,id',
        ]);

        $ticket = Ticket::create($request->only(
            'title', 'description', 'priority', 'customer_id', 'assigned_to'
        ));

        return response()->json([
            'message' => 'Tiket berhasil dibuat',
            'data'    => $ticket->load(['customer:id,name', 'assignedTo:id,name'])
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);
        $request->validate([
            'status'          => 'sometimes|in:open,in_progress,resolved,closed',
            'title'           => 'sometimes|string',
            'priority'        => 'sometimes|in:low,medium,high,urgent',
            'assigned_to'     => 'nullable|exists:users,id',
            'resolution'      => 'nullable|string',
            'proof_image'     => 'nullable|string',
            'signature_image' => 'nullable|string',
        ]);

        $data = $request->all();

        // Handle uploaded file if proof_image is a file
        if ($request->hasFile('proof_image')) {
            $file = $request->file('proof_image');
            $filename = 'proof_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('storage/proofs'), $filename);
            $data['proof_image'] = asset('storage/proofs/' . $filename);
        } elseif ($request->filled('proof_image') && strpos($request->proof_image, 'data:image') === 0) {
            // Decode base64 image and save
            $base64 = $request->proof_image;
            $image_parts = explode(";base64,", $base64);
            $image_type_aux = explode("image/", $image_parts[0]);
            $image_type = $image_type_aux[1];
            $image_base64 = base64_decode($image_parts[1]);
            $filename = 'proof_' . time() . '_' . uniqid() . '.' . $image_type;
            
            // Ensure directory exists
            $dir = public_path('storage/proofs');
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }
            
            file_put_contents($dir . '/' . $filename, $image_base64);
            $data['proof_image'] = asset('storage/proofs/' . $filename);
        }

        $ticket->update($data);

        return response()->json([
            'message' => 'Tiket berhasil diperbarui',
            'data'    => $ticket->load(['customer:id,name', 'assignedTo:id,name'])
        ]);
    }

    public function destroy($id)
    {

        $ticket = Ticket::findOrFail($id);
        $ticket->delete();
        return response()->json(['message' => 'Tiket berhasil dihapus']);
    }
}

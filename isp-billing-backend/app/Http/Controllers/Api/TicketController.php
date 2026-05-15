<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;
use App\Traits\DemoMockTrait;

class TicketController extends Controller
{
    use DemoMockTrait;
    public function index()
    {
        if ($this->isDemoUser()) {
            return response()->json($this->getMockTickets());
        }

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
        if ($this->isDemoUser()) {
            return response()->json([
                'message' => 'Tiket berhasil diperbarui (Demo)',
                'data' => array_merge(['id' => $id], $request->all())
            ]);
        }

        $ticket = Ticket::findOrFail($id);
        $request->validate([
            'status'     => 'sometimes|in:open,in_progress,resolved,closed',
            'title'      => 'sometimes|string',
            'priority'   => 'sometimes|in:low,medium,high,urgent',
            'assigned_to'=> 'nullable|exists:users,id',
            'resolution' => 'nullable|string',
        ]);

        $ticket->update($request->all());

        return response()->json([
            'message' => 'Tiket berhasil diperbarui',
            'data'    => $ticket->load(['customer:id,name', 'assignedTo:id,name'])
        ]);
    }

    public function destroy($id)
    {
        if ($this->isDemoUser()) {
            return response()->json(['message' => 'Tiket berhasil dihapus (Demo)']);
        }

        $ticket = Ticket::findOrFail($id);
        $ticket->delete();
        return response()->json(['message' => 'Tiket berhasil dihapus']);
    }
}

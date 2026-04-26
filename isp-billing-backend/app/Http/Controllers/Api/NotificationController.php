<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index()
    {
        return response()->json(
            Notification::with('sender:id,name')
                ->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'   => 'required|string',
            'message' => 'required|string',
            'type'    => 'required|in:broadcast,personal',
        ]);

        // Hitung jumlah penerima
        $recipientCount = $request->type === 'broadcast'
            ? Customer::where('status', 'aktif')->count()
            : 1;

        $notif = Notification::create([
            'title'           => $request->title,
            'message'         => $request->message,
            'type'            => $request->type,
            'sent_by'         => Auth::id(),
            'recipient_count' => $recipientCount,
        ]);

        // Di sini nanti akan dikirim ke WA (Fase berikutnya)
        // Untuk sekarang, hanya simpan ke database sebagai log

        return response()->json([
            'message' => "Notifikasi berhasil dikirim ke {$recipientCount} penerima",
            'data'    => $notif->load('sender:id,name')
        ], 201);
    }

    public function destroy(Notification $notification)
    {
        $notification->delete();
        return response()->json(['message' => 'Notifikasi dihapus dari log']);
    }
}

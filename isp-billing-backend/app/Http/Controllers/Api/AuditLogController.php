<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{

    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,name,role')->latest();

        // Filter by action type
        if ($request->has('action') && $request->action !== 'all') {
            $query->where('action', 'like', "%{$request->action}%");
        }

        // Filter by user
        if ($request->has('user_id') && $request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        return response()->json($query->limit(100)->get());
    }

    public function destroy(AuditLog $auditLog)
    {
        $auditLog->delete();
        return response()->json(['message' => 'Log dihapus']);
    }

    /**
     * Hapus semua log (hanya pemilik)
     */
    public function clear()
    {
        AuditLog::truncate();
        return response()->json(['message' => 'Semua log berhasil dihapus']);
    }
}

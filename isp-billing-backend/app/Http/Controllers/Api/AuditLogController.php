<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use App\Traits\DemoMockTrait;

class AuditLogController extends Controller
{
    use DemoMockTrait;

    public function index(Request $request)
    {
        if ($this->isDemoUser()) {
            return response()->json($this->getMockAuditLogs());
        }
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
        if ($this->isDemoUser()) {
            return response()->json(['message' => 'Mode Demo: Log tidak dapat dihapus.'], 403);
        }
        AuditLog::truncate();
        return response()->json(['message' => 'Semua log berhasil dihapus']);
    }
}

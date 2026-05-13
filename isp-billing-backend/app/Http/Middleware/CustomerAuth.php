<?php

namespace App\Http\Middleware;

use App\Models\CustomerToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CustomerAuth Middleware
 * Memvalidasi session token customer dari header Authorization: Bearer {token}
 */
class CustomerAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken();

        if (!$bearerToken) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Silakan login terlebih dahulu.',
            ], 401);
        }

        // Cari session token yang valid
        $tokenRecord = CustomerToken::with('customer')
            ->where('token', $bearerToken)
            ->where('type', 'session')
            ->valid() // scope: belum expired & belum di-invalidate
            ->first();

        if (!$tokenRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi Anda telah berakhir. Silakan login kembali.',
            ], 401);
        }

        // Inject customer ke request agar bisa dipakai di controller
        $request->merge(['customer' => $tokenRecord->customer]);
        $request->customer = $tokenRecord->customer;

        return $next($request);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Handle Login Request
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Username atau password salah.'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Dispatch audit log job - gagal job tidak menggagalkan login
        try {
            \App\Jobs\RecordAuditLog::dispatch(
                $user->id,
                'LOGIN',
                "Login berhasil ({$user->role})",
                $request->ip()
            );
        } catch (\Exception $e) {
            // Log error tapi lanjutkan proses login
            \Illuminate\Support\Facades\Log::warning('Audit log job failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Login berhasil!',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ]);
    }

    /**
     * Handle Demo Login for each role
     */
    public function demoLogin(Request $request)
    {
        $request->validate([
            'role' => 'required|in:pemilik,admin,teknisi',
        ]);

        $role = $request->role;
        $username = "demo_{$role}";
        
        $user = User::where('username', $username)->first();
        
        if (!$user) {
            // Auto-create demo user if not exists
            $user = User::create([
                'name' => 'Demo ' . ucfirst($role),
                'username' => $username,
                'email' => "{$username}@netbilling.com",
                'password' => Hash::make('demo123'),
                'role' => $role,
            ]);
        }

        $token = $user->createToken('demo_token')->plainTextToken;

        return response()->json([
            'message' => 'Login Demo Berhasil!',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ]);
    }

    /**
     * Handle Logout Request
     */
    public function logout(Request $request)
    {
        AuditLog::record('LOGOUT', 'Logout dari sistem', $request);
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Berhasil logout'
        ]);
    }

    /**
     * Get Authenticated User
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }
}

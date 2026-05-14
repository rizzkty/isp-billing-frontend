<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Traits\DemoMockTrait;

class UserController extends Controller
{
    use DemoMockTrait;

    public function index()
    {
        if ($this->isDemoUser()) {
            return response()->json($this->getMockUsers());
        }
        return response()->json(
            User::select('id', 'name', 'username', 'role', 'created_at')
                ->latest()->get()
        );
    }

    public function store(Request $request)
    {
        if ($this->isDemoUser()) {
            return response()->json(['message' => 'Mode Demo: Tidak dapat menambah staff baru.'], 403);
        }
        $request->validate([
            'name'     => 'required|string|max:100',
            'username' => 'required|string|unique:users,username',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:admin,teknisi,pemilik',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        return response()->json([
            'message' => 'Akun berhasil dibuat',
            'data'    => $user
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'role' => 'required|in:admin,teknisi,pemilik',
        ]);

        $user->name = $request->name;
        $user->role = $request->role;

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Akun berhasil diperbarui',
            'data'    => $user
        ]);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'Akun berhasil dihapus']);
    }
}

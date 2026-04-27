<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationTemplate;
use Illuminate\Http\Request;

class NotificationTemplateController extends Controller
{
    public function index()
    {
        return response()->json(NotificationTemplate::orderBy('is_default', 'desc')->orderBy('created_at')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:100',
            'title'   => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $template = NotificationTemplate::create($validated);

        return response()->json([
            'message' => 'Template berhasil disimpan',
            'data'    => $template
        ], 201);
    }

    public function update(Request $request, NotificationTemplate $notificationTemplate)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:100',
            'title'   => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $notificationTemplate->update($validated);

        return response()->json([
            'message' => 'Template berhasil diperbarui',
            'data'    => $notificationTemplate
        ]);
    }

    public function destroy(NotificationTemplate $notificationTemplate)
    {
        if ($notificationTemplate->is_default) {
            return response()->json(['message' => 'Template bawaan tidak dapat dihapus'], 403);
        }

        $notificationTemplate->delete();
        return response()->json(['message' => 'Template berhasil dihapus']);
    }
}

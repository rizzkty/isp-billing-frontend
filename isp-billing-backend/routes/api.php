<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NetworkController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\NotificationTemplateController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\RadiusController;
use App\Http\Controllers\Api\NocController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\IsolirController;
use App\Http\Controllers\Api\NetworkMapController;
use App\Http\Controllers\Api\XenditController;
use App\Http\Controllers\Portal\CustomerAuthController;
use App\Http\Controllers\Portal\CustomerPortalController;


// ==========================================
// PUBLIC ROUTES
// ==========================================

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'app' => config('app.name'),
        'version' => '1.0.0'
    ]);
});

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// Rute untuk Tarik Data Awal NOC (INI YANG SEMPAT HILANG!)
Route::get('/noc/stats', [NocController::class, 'getStats']);
Route::get('/noc/traffic', [NocController::class, 'getTraffic']);
Route::get('/noc/live', [NocController::class, 'getLiveMonitor']);

// Rute untuk MENGAMBIL dan MENYIMPAN data pengaturan
Route::get('/pengaturan-jaringan', [SettingController::class, 'getSettings']);
Route::post('/pengaturan-jaringan', [SettingController::class, 'store']);

// Endpoint Test MikroTik & Database Radius
Route::post('/mikrotik/test-api', [NetworkController::class, 'testMikrotik']);
Route::post('/radius/test-db', [RadiusController::class, 'testDbConnection']);
Route::get('/radius/sessions', [RadiusController::class, 'getActiveSessions']);


// ==========================================
// PROTECTED ROUTES (Butuh Login / Token)
// ==========================================
Route::middleware('auth:sanctum')->group(function () {
    
    // === AKSES SEMUA ROLE (Admin, Teknisi, Pemilik) ===
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', [DashboardController::class, 'index']);
    
    // Network Read-Only
    Route::get('/network', [NetworkController::class, 'index']);
    Route::get('/network/map-live', [NetworkMapController::class, 'getLiveMapData']);
    
    // Customer & Package Read-Only
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::get('/packages', [PackageController::class, 'index']);
    Route::get('/packages/{package}', [PackageController::class, 'show']);
    
    // Tickets Read-Only
    Route::get('/tickets', [TicketController::class, 'index']);

    // === AKSES ADMIN & PEMILIK ===
    Route::middleware('role:admin,pemilik')->group(function () {
        Route::get('/reports', [ReportController::class, 'index']);
        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
        Route::get('/invoices/{invoice}/print', [InvoiceController::class, 'print']);
    });

    // === AKSES ADMIN & TEKNISI ===
    Route::middleware('role:admin,teknisi')->group(function () {
        // Edit/Create Tickets
        Route::post('/tickets', [TicketController::class, 'store']);
        Route::put('/tickets/{ticket}', [TicketController::class, 'update']);
        Route::delete('/tickets/{ticket}', [TicketController::class, 'destroy']);
        
        // Manage Network Nodes
        Route::post('/network/nodes', [NetworkController::class, 'storeNode']);
        Route::put('/network/nodes/{node}', [NetworkController::class, 'updateNode']);
        Route::post('/network/edges', [NetworkController::class, 'storeEdge']);
        Route::delete('/network/nodes/{node}', [NetworkController::class, 'destroyNode']);
    });

    // === AKSES ADMIN ONLY ===
    Route::middleware('role:admin,pemilik')->group(function () {
        // Manage Customers & Packages
        Route::post('/customers', [CustomerController::class, 'store']);
        Route::put('/customers/{customer}', [CustomerController::class, 'update']);
        Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
        
        Route::post('/packages', [PackageController::class, 'store']);
        Route::put('/packages/{package}', [PackageController::class, 'update']);
        Route::delete('/packages/{package}', [PackageController::class, 'destroy']);
        
        // Manage Invoices
        Route::post('/invoices/generate', [InvoiceController::class, 'generate']);
        Route::post('/invoices', [InvoiceController::class, 'store']);
        Route::put('/invoices/{invoice}', [InvoiceController::class, 'update']);
        Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy']);
        
        // Settings & Isolir (Ini bawaan aplikasi Anda)
        Route::get('/settings', [SettingController::class, 'getSettings']);
        Route::post('/settings', [SettingController::class, 'saveSettings']);
        Route::post('/isolir/run', [IsolirController::class, 'runAutoIsolir']);

        // Users Management
        Route::apiResource('users', UserController::class)->except(['show']);

        // Audit Logs
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
        Route::delete('/audit-logs/{auditLog}', [AuditLogController::class, 'destroy']);
        Route::delete('/audit-logs', [AuditLogController::class, 'clear']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications', [NotificationController::class, 'store']);
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);
        
        Route::get('/notification-templates', [NotificationTemplateController::class, 'index']);
        Route::post('/notification-templates', [NotificationTemplateController::class, 'store']);
        Route::put('/notification-templates/{notificationTemplate}', [NotificationTemplateController::class, 'update']);
        Route::delete('/notification-templates/{notificationTemplate}', [NotificationTemplateController::class, 'destroy']);

        // Xendit: Generate payment link + kirim WA (admin)
        Route::post('/invoices/{invoice}/payment-link', [XenditController::class, 'createLink']);
        Route::post('/invoices/{invoice}/send-payment-link', [XenditController::class, 'sendViaWhatsApp']);
    });
});

// ==========================================
// XENDIT WEBHOOK (Public — no auth, tapi diverifikasi by token)
// ==========================================
Route::post('/xendit/webhook', [XenditController::class, 'handleWebhook']);

// ==========================================
// CLIENT PORTAL ROUTES
// ==========================================
Route::prefix('portal')->group(function () {

    // Public: request & verify magic link
    Route::post('/auth/request-link', [CustomerAuthController::class, 'requestLink'])
        ->middleware('throttle:5,1'); // max 5 request per menit
    Route::post('/auth/verify-link', [CustomerAuthController::class, 'verifyLink'])
        ->middleware('throttle:10,1');
    Route::post('/auth/demo', [CustomerAuthController::class, 'demoLogin']);

    // Protected: customer harus sudah login (session token)
    Route::middleware('customer.auth')->group(function () {
        Route::post('/auth/logout', [CustomerAuthController::class, 'logout']);

        Route::get('/me', [CustomerPortalController::class, 'profile']);

        Route::get('/invoices', [CustomerPortalController::class, 'invoices']);
        Route::get('/invoices/{id}', [CustomerPortalController::class, 'invoiceDetail']);
        Route::get('/invoices/{id}/pay', [CustomerPortalController::class, 'getPaymentUrl']);

        Route::get('/tickets', [CustomerPortalController::class, 'tickets']);
        Route::post('/tickets', [CustomerPortalController::class, 'createTicket']);
    });
});
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

// Public Routes
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard Stats
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Network Map
    Route::get('/network', [NetworkController::class, 'index']);
    Route::post('/network/nodes', [NetworkController::class, 'storeNode']);
    Route::post('/network/edges', [NetworkController::class, 'storeEdge']);
    Route::delete('/network/nodes/{node}', [NetworkController::class, 'destroyNode']);

    // Customers Management
    Route::apiResource('customers', CustomerController::class);

    // Packages Management
    Route::apiResource('packages', PackageController::class);

    // Invoices Management
    Route::post('/invoices/generate', [InvoiceController::class, 'generate']);
    Route::get('/invoices/{invoice}/print', [InvoiceController::class, 'print']);
    Route::apiResource('invoices', InvoiceController::class);

    // Users / Staff Management
    Route::apiResource('users', UserController::class)->except(['show']);

    // Ticketing
    Route::apiResource('tickets', TicketController::class)->except(['show']);

    // Financial Reports
    Route::get('/reports', [ReportController::class, 'index']);

    // Notifications / Broadcast
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);
});

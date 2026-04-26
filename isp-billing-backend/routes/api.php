<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\InvoiceController;

// Public Routes
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Customers Management
    Route::apiResource('customers', CustomerController::class);

    // Packages Management
    Route::apiResource('packages', PackageController::class);

    // Invoices Management
    Route::post('/invoices/generate', [InvoiceController::class, 'generate']);
    Route::apiResource('invoices', InvoiceController::class);
});

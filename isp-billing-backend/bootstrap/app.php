<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Security: Force HTTPS and add security headers
        $middleware->append(\App\Http\Middleware\ForceHttpsAndSecurityHeaders::class);
        $middleware->append(\App\Http\Middleware\SanitizeInput::class);
        
        $middleware->alias([
            'role'          => \App\Http\Middleware\CheckRole::class,
            'customer.auth' => \App\Http\Middleware\CustomerAuth::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Untuk request API yang tidak terautentikasi, 
        // kembalikan JSON 401 bukan redirect ke halaman login
        $exceptions->shouldRenderJsonWhen(function ($request, $e) {
            return $request->is('api/*') || $request->expectsJson();
        });
    })->create();

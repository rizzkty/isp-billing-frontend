<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Force HTTPS for all requests in production
 * Also adds security headers (HSTS, CSP, etc.)
 */
class ForceHttpsAndSecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Force HTTPS redirect in production
        if (env('HTTPS_ONLY', false) && !$request->secure() && app()->environment('production')) {
            return redirect()->secure($request->getRequestUri());
        }

        $response = $next($request);

        // Add security headers
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload', true);
        $response->headers->set('X-Content-Type-Options', 'nosniff', true);
        $response->headers->set('X-Frame-Options', 'DENY', true);
        $response->headers->set('X-XSS-Protection', '1; mode=block', true);
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin', true);
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()', true);
        
        // Content Security Policy
        $response->headers->set('Content-Security-Policy', 
            "default-src 'self'; " .
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " .
            "style-src 'self' 'unsafe-inline'; " .
            "img-src 'self' data: http: https:; " .
            "font-src 'self'; " .
            "connect-src 'self' http: https:; " .
            "frame-ancestors 'none'; " .
            "base-uri 'self'; " .
            "form-action 'self'",
            true
        );

        return $response;
    }
}

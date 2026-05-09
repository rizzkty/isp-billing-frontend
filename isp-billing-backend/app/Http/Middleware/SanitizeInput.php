<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();

        array_walk_recursive($input, function (&$item) {
            if (is_string($item)) {
                // Strip tags for basic sanitization
                $item = strip_tags($item);
                // Trim whitespace
                $item = trim($item);
            }
        });

        $request->merge($input);

        return $next($request);
    }
}

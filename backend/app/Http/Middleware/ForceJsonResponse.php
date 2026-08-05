<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Fuerza que toda request a la API se trate como JSON. Garantiza respuestas
 * 401/403/422 en JSON (sin redirecciones a "login") aunque el cliente no envíe
 * el header Accept.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}

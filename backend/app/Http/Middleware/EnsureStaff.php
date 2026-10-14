<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Deja pasar solo al personal (admin o vendedor). Se usa DESPUÉS de auth:sanctum:
 * estar logueado no alcanza, porque cualquier cliente puede registrarse y tener
 * sesión — sin este chequeo podría llamar a las rutas del panel (pedidos, POS,
 * cupones, ajustes, clientes…).
 */
class EnsureStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isStaff()) {
            return response()->json(['message' => 'No tenés permiso para hacer esto.'], 403);
        }

        return $next($request);
    }
}

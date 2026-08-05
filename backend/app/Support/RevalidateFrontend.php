<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Avisa al frontend (Next.js) que revalide al instante ciertas páginas
 * después de guardar cambios en el admin, para no depender de la ventana de
 * caché ISR (revalidate=60) — evitaba que una edición pareciera "no se
 * guardó" o "quedó mal" cuando en realidad solo faltaba refrescar el caché.
 *
 * Nunca debe romper el flujo de negocio: cualquier fallo queda logueado y
 * se ignora (igual que Mailer::safe).
 */
class RevalidateFrontend
{
    /** Revalida la ficha de un producto + la tienda + el home. */
    public static function product(string $slug): void
    {
        self::paths(["/producto/{$slug}", '/tienda', '/']);
    }

    public static function paths(array $paths): void
    {
        $url = config('services.frontend.revalidate_url');
        $secret = config('services.frontend.revalidate_secret');
        if (! $url || ! $secret || ! $paths) {
            return;
        }

        try {
            Http::timeout(5)->post($url, [
                'secret' => $secret,
                'paths' => $paths,
            ]);
        } catch (\Throwable $e) {
            Log::warning('RevalidateFrontend falló: '.$e->getMessage());
        }
    }
}

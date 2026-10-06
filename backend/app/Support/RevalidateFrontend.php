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
    /**
     * Revalida la ficha de un producto + la tienda + el home, e invalida las
     * etiquetas de caché de datos "products" y "categories" (una categoría
     * aparece o desaparece del menú según tenga productos activos).
     */
    public static function product(string $slug): void
    {
        self::paths(["/producto/{$slug}", '/tienda', '/'], ['products', 'categories']);
    }

    /**
     * Revalida páginas puntuales y, opcionalmente, etiquetas de caché de datos.
     * Un frontend viejo (sin soporte de `tags`) ignora las etiquetas y revalida
     * los paths igual, así que el orden de despliegue no rompe nada.
     */
    public static function paths(array $paths, array $tags = []): void
    {
        self::send(['paths' => $paths, 'tags' => $tags]);
    }

    /**
     * Invalida etiquetas de la caché de datos de Next (ej. "categories",
     * "settings", "products") en TODAS las páginas que usan esa data.
     */
    public static function tags(array $tags): void
    {
        self::send(['tags' => $tags]);
    }

    private static function send(array $payload): void
    {
        $url = config('services.frontend.revalidate_url');
        $secret = config('services.frontend.revalidate_secret');
        $payload = array_filter($payload);
        if (! $url || ! $secret || ! $payload) {
            return;
        }

        try {
            Http::timeout(5)->post($url, ['secret' => $secret] + $payload);
        } catch (\Throwable $e) {
            Log::warning('RevalidateFrontend falló: '.$e->getMessage());
        }
    }
}

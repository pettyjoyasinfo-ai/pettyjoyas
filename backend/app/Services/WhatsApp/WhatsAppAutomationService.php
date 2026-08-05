<?php

namespace App\Services\WhatsApp;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * "Componentes conversacionales" de WhatsApp Cloud API: mensaje de bienvenida,
 * ice breakers (disparadores de conversación) y comandos (/algo). Es pura
 * configuración de UI de WhatsApp — no requiere el bot/webhook, un mensaje
 * tocado o un comando escrito le llega al negocio como un mensaje normal.
 */
class WhatsAppAutomationService
{
    private const API_VERSION = 'v22.0';

    /** Empuja la configuración a Meta. Devuelve si se sincronizó y el detalle de la respuesta. */
    public function push(array $config): array
    {
        $token = config('services.whatsapp.token');
        $phoneId = config('services.whatsapp.phone_id');

        if (! $token || ! $phoneId) {
            return ['ok' => false, 'error' => 'Faltan las credenciales de WhatsApp (WHATSAPP_TOKEN / WHATSAPP_PHONE_ID) en el .env.'];
        }

        $prompts = collect($config['ice_breakers'] ?? [])
            ->map(fn ($p) => trim((string) $p))
            ->filter()
            ->values()
            ->all();

        $commands = collect($config['commands'] ?? [])
            ->filter(fn ($c) => ! empty($c['name']))
            ->map(fn ($c) => [
                'command_name' => $c['name'],
                'command_description' => $c['description'] ?? '',
            ])
            ->values()
            ->all();

        try {
            $response = Http::withToken($token)
                ->post("https://graph.facebook.com/".self::API_VERSION."/{$phoneId}/conversational_automation", [
                    'enable_welcome_message' => (bool) ($config['welcome_enabled'] ?? true),
                    'prompts' => $prompts,
                    'commands' => $commands,
                ]);

            if (! $response->successful()) {
                Log::warning('WhatsApp conversational_automation falló: '.$response->body());

                return ['ok' => false, 'error' => $response->json('error.message') ?? 'Meta rechazó la configuración.'];
            }

            return ['ok' => true, 'body' => $response->json()];
        } catch (\Throwable $e) {
            Log::warning('WhatsApp conversational_automation excepción: '.$e->getMessage());

            return ['ok' => false, 'error' => 'No se pudo conectar con la API de WhatsApp.'];
        }
    }

    /** Lee la configuración vigente directo desde Meta (para verificar que quedó bien aplicada). */
    public function fetch(): array
    {
        $token = config('services.whatsapp.token');
        $phoneId = config('services.whatsapp.phone_id');

        if (! $token || ! $phoneId) {
            return ['ok' => false, 'error' => 'Faltan las credenciales de WhatsApp.'];
        }

        $response = Http::withToken($token)
            ->get("https://graph.facebook.com/".self::API_VERSION."/{$phoneId}", [
                'fields' => 'conversational_automation',
            ]);

        if (! $response->successful()) {
            return ['ok' => false, 'error' => $response->json('error.message') ?? 'No se pudo consultar Meta.'];
        }

        return ['ok' => true, 'body' => $response->json('conversational_automation') ?? []];
    }
}

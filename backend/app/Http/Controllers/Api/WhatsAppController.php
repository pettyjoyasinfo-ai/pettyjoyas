<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Services\WhatsApp\WhatsAppBotService;
use App\Services\WhatsApp\WhatsAppInboxService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WhatsAppController extends Controller
{
    public function __construct(
        private WhatsAppBotService $bot,
        private WhatsAppInboxService $inbox,
    ) {}

    /** Verificación del webhook (handshake de Meta). */
    public function verify(Request $request)
    {
        $verifyToken = config('services.whatsapp.verify_token');

        if ($request->query('hub_verify_token') === $verifyToken) {
            return response($request->query('hub_challenge'), 200);
        }

        return response('Forbidden', 403);
    }

    /** Recepción de mensajes entrantes de WhatsApp. */
    public function receive(Request $request)
    {
        if (! $this->hasValidSignature($request)) {
            Log::warning('WhatsApp webhook: firma inválida, se descarta el payload.');

            return $this->ack();
        }

        $value = $request->input('entry.0.changes.0.value', []);
        $message = $value['messages'][0] ?? null;

        // Sin mensaje (ej. eventos de estado: entregado/leído) → nada que hacer.
        if (! $message) {
            return $this->ack();
        }

        $from = $message['from'] ?? null;
        $type = $message['type'] ?? 'text';
        $messageId = $message['id'] ?? null;

        if (! $from) {
            return $this->ack();
        }

        $name = $value['contacts'][0]['profile']['name'] ?? null;
        $inboundText = $this->inboundText($type, $message);

        // Guardamos el mensaje del cliente en la bandeja (aunque la IA no responda).
        $this->inbox->recordInbound($from, $name, $inboundText, $type, $messageId);

        // Marca el mensaje como leído (tilde azul).
        $this->bot->markRead($messageId);

        // Interruptor general: si la IA está desactivada para todo el negocio,
        // no respondemos a nadie (el mensaje ya quedó guardado en la bandeja).
        if (! self::aiGloballyEnabled()) {
            return $this->ack();
        }

        // Si un humano tomó la conversación (IA en pausa), no auto-respondemos:
        // el mensaje queda en la bandeja esperando respuesta del equipo.
        if ($this->inbox->isAiPaused($from)) {
            return $this->ack();
        }

        $answer = $this->buildAnswer($type, $message, $from, $inboundText);

        try {
            $this->bot->send($from, $answer);
            $this->inbox->recordOutbound($from, 'ai', $answer);
        } catch (\Throwable $e) {
            Log::warning("WhatsApp webhook: falló el envío a {$from} — {$e->getMessage()}");
        }

        return $this->ack();
    }

    /** Extrae el texto legible del mensaje entrante según su tipo (para guardar). */
    private function inboundText(string $type, array $message): ?string
    {
        return match ($type) {
            'text'        => trim($message['text']['body'] ?? ''),
            'interactive' => $message['interactive']['button_reply']['title']
                ?? $message['interactive']['list_reply']['title']
                ?? null,
            default       => null,
        };
    }

    /**
     * Decide la respuesta según el tipo de mensaje. Solo el texto/interactivo
     * pasa por la IA; los demás tipos (audio, imagen, etc.) reciben una guía.
     */
    private function buildAnswer(string $type, array $message, string $from, ?string $inboundText): string
    {
        if ($type === 'text') {
            $text = (string) $inboundText;

            // Comando simple para empezar la charla de cero.
            if (in_array(Str::lower($text), ['reiniciar', 'reset', 'empezar de nuevo'], true)) {
                $this->bot->resetHistory($from);

                return 'Listo, empezamos de cero 💛 ¿En qué te puedo ayudar?';
            }

            if ($text === '') {
                return '¿Me contás en qué te puedo ayudar? 💎';
            }

            return $this->safeReply($text, $from);
        }

        if ($type === 'interactive' && $inboundText) {
            return $this->safeReply($inboundText, $from);
        }

        // Tipos que todavía no procesamos (audio, imagen, sticker, ubicación, etc.).
        return 'Por ahora solo puedo leer mensajes de texto 💬. Escribime tu consulta '
            .'(un producto, precio, envío o el estado de tu pedido) y te ayudo al toque 💎';
    }

    /** Envuelve la IA para que un error nunca deje al cliente sin respuesta. */
    private function safeReply(string $text, string $from): string
    {
        try {
            return $this->bot->reply($text, $from);
        } catch (\Throwable $e) {
            Log::warning("WhatsApp webhook: falló la IA para {$from} — {$e->getMessage()}");

            return 'Perdón, tuve un problema para procesar tu mensaje 😅. Probá de nuevo en un ratito, '
                .'o escribinos y te responde una persona del equipo 💛';
        }
    }

    /** Meta exige responder 200 rápido; siempre devolvemos ok. */
    private function ack()
    {
        return response()->json(['received' => true]);
    }

    /** Config de la IA de WhatsApp: interruptor general + instrucciones extra del negocio. */
    public static function aiConfig(): array
    {
        $value = SiteSetting::where('key', 'whatsapp_ai')->value('value') ?? [];

        return [
            'enabled'      => (bool) ($value['enabled'] ?? false),   // apagada por defecto
            'instructions' => (string) ($value['instructions'] ?? ''),
        ];
    }

    /** Interruptor general de la IA de WhatsApp. Apagado por defecto: hay que activarlo a mano. */
    public static function aiGloballyEnabled(): bool
    {
        return self::aiConfig()['enabled'];
    }

    /** Valida el header X-Hub-Signature-256 con el App Secret, para descartar payloads falsificados. */
    private function hasValidSignature(Request $request): bool
    {
        $secret = config('services.whatsapp.app_secret');
        if (! $secret) {
            return true; // sin secret configurado, no se puede validar (modo dev)
        }

        $header = $request->header('X-Hub-Signature-256', '');
        $expected = 'sha256='.hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, $header);
    }
}

<?php

namespace App\Services\WhatsApp;

use App\Models\Customer;
use App\Services\AI\ChatbotService;
use App\Support\Mailer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Bot de WhatsApp: reusa el mismo ChatbotService (IA con tool-calling sobre
 * catálogo/pedidos reales) que el chat del sitio, en vez de duplicar lógica.
 *
 * A diferencia del chat del sitio (que manda el historial completo en cada
 * request), acá guardamos el historial por número en cache, así el bot
 * recuerda el contexto de la charla (ej. si ya dio su número de pedido y email,
 * no se lo vuelve a pedir).
 */
class WhatsAppBotService
{
    /** Cuántos mensajes recordar (user+assistant) por conversación. */
    private const HISTORY_LIMIT = 16;

    /** Cuánto vive el historial sin actividad (se refresca en cada mensaje). */
    private const HISTORY_TTL_MINUTES = 180;

    public function __construct(private ChatbotService $chatbot) {}

    /** Genera una respuesta a un mensaje entrante, con memoria de la conversación. */
    public function reply(string $text, string $from): string
    {
        // Si el cliente pide hablar con una persona, avisamos al equipo por
        // email (una vez por hora por número, para no spamear). La IA le sigue
        // respondiendo mientras tanto.
        if ($this->wantsHuman($text)) {
            $this->notifyTeam($from, $text);
        }

        $key = "wa_history:{$from}";
        $history = Cache::get($key, []);

        $history[] = ['role' => 'user', 'content' => $text];
        $history = array_slice($history, -self::HISTORY_LIMIT);

        $answer = $this->chatbot->chat($history, $this->findCustomerByPhone($from), 'whatsapp');

        $history[] = ['role' => 'assistant', 'content' => $answer];
        $history = array_slice($history, -self::HISTORY_LIMIT);
        Cache::put($key, $history, now()->addMinutes(self::HISTORY_TTL_MINUTES));

        return $answer;
    }

    /** Olvida el historial de una conversación (ej. cuando el cliente escribe "reiniciar"). */
    public function resetHistory(string $from): void
    {
        Cache::forget("wa_history:{$from}");
        Cache::forget("wa_handoff_notified:{$from}"); // al reiniciar, puede volver a pedir humano
    }

    /** Detecta si el cliente está pidiendo hablar con una persona real. */
    private function wantsHuman(string $text): bool
    {
        $t = mb_strtolower($text);
        $frases = [
            'hablar con', 'con una persona', 'con alguien', 'un vendedor', 'una vendedora',
            'atencion humana', 'atención humana', 'persona real', 'humano', 'asesor',
            'operador', 'representante', 'atienda alguien', 'que me atiendan',
        ];
        foreach ($frases as $f) {
            if (str_contains($t, $f)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Avisa por email al equipo UNA sola vez por conversación: aunque el
     * cliente lo pida varias veces, el mail sale una vez. Se vuelve a habilitar
     * si la charla se reinicia (resetHistory) o tras 24 h sin actividad.
     */
    private function notifyTeam(string $from, string $text): void
    {
        $flag = "wa_handoff_notified:{$from}";
        if (Cache::has($flag)) {
            return;
        }
        Cache::put($flag, true, now()->addDay());

        Mailer::whatsappHandoff($from, $text);
    }

    /**
     * Vincula el wa_id (ej. "5493757123456") con un Customer registrado,
     * comparando los últimos 10 dígitos para tolerar distintos formatos de
     * carga (con/sin 0, 15, espacios, guiones).
     */
    private function findCustomerByPhone(string $waId): ?Customer
    {
        $suffix = substr(preg_replace('/\D/', '', $waId), -10);
        if (! $suffix) {
            return null;
        }

        return Customer::whereNotNull('phone')
            ->get()
            ->first(fn ($c) => str_ends_with(preg_replace('/\D/', '', $c->phone), $suffix));
    }

    /** Envía un mensaje de texto saliente vía WhatsApp Cloud API. Devuelve si salió bien. */
    public function send(string $to, string $body): bool
    {
        $token = config('services.whatsapp.token');
        $phoneId = config('services.whatsapp.phone_id');
        if (! $token || ! $phoneId) {
            return false; // sin credenciales, no se envía (modo demo)
        }

        $response = Http::withToken($token)->post("https://graph.facebook.com/v22.0/{$phoneId}/messages", [
            'messaging_product' => 'whatsapp',
            'to' => $to,
            'type' => 'text',
            'text' => ['body' => $body],
        ]);

        return $response->successful();
    }

    /** Marca un mensaje entrante como leído (doble tilde azul), para que se vea que el negocio lo recibió. */
    public function markRead(?string $messageId): void
    {
        $token = config('services.whatsapp.token');
        $phoneId = config('services.whatsapp.phone_id');
        if (! $token || ! $phoneId || ! $messageId) {
            return;
        }

        Http::withToken($token)->post("https://graph.facebook.com/v22.0/{$phoneId}/messages", [
            'messaging_product' => 'whatsapp',
            'status' => 'read',
            'message_id' => $messageId,
        ]);
    }
}

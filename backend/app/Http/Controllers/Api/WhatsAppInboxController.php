<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Models\WhatsAppConversation;
use App\Models\WhatsAppMessage;
use App\Services\WhatsApp\WhatsAppBotService;
use App\Services\WhatsApp\WhatsAppInboxService;
use Illuminate\Http\Request;

/**
 * Bandeja de entrada de WhatsApp para el panel admin: listar conversaciones,
 * ver el hilo, responder como vendedor (pausa la IA) y pausar/reactivar la IA.
 */
class WhatsAppInboxController extends Controller
{
    public function __construct(
        private WhatsAppBotService $bot,
        private WhatsAppInboxService $inbox,
    ) {}

    /** Lista de conversaciones, más recientes primero. Con ?archived=1 devuelve las archivadas. */
    public function index(Request $request)
    {
        $archived = $request->boolean('archived');

        $convos = WhatsAppConversation::when(
                $archived,
                fn ($q) => $q->whereNotNull('archived_at'),
                fn ($q) => $q->whereNull('archived_at'),
            )
            ->orderByDesc('last_message_at')
            ->limit(200)
            ->get();

        return response()->json($convos->map(fn ($c) => $this->convoJson($c)));
    }

    /** Hilo completo de una conversación (marca como leída al abrir). */
    public function messages(string $waId)
    {
        $convo = WhatsAppConversation::where('wa_id', $waId)->first();
        if (! $convo) {
            return response()->json(['conversation' => null, 'messages' => []]);
        }

        // Al abrir la conversación, se considera vista por el equipo.
        if ($convo->unread > 0) {
            $convo->update(['unread' => 0]);
        }

        $messages = WhatsAppMessage::where('wa_id', $waId)
            ->orderBy('id')
            ->limit(500)
            ->get()
            ->map(fn ($m) => [
                'id'        => $m->id,
                'direction' => $m->direction,
                'sender'    => $m->sender,
                'body'      => $m->body,
                'type'      => $m->type,
                'at'        => $m->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'conversation' => $this->convoJson($convo->refresh()),
            'messages'     => $messages,
        ]);
    }

    /** El vendedor responde: envía el mensaje, lo guarda y pausa la IA en ese chat. */
    public function send(Request $request, string $waId)
    {
        $data = $request->validate([
            'body' => ['required', 'string', 'max:4000'],
        ]);

        $ok = $this->bot->send($waId, $data['body']);

        if (! $ok) {
            return response()->json([
                'message' => 'No se pudo enviar. WhatsApp solo permite escribir libremente dentro de las 24 h del último mensaje del cliente.',
            ], 422);
        }

        $this->inbox->recordOutbound($waId, 'staff', $data['body']);

        // Al responder un humano, la IA se pausa en esta conversación.
        WhatsAppConversation::where('wa_id', $waId)->update(['ai_paused' => true, 'unread' => 0]);

        return response()->json(['sent' => true]);
    }

    /** Marca la conversación como leída (pone en cero los no leídos). */
    public function markRead(string $waId)
    {
        WhatsAppConversation::where('wa_id', $waId)->update(['unread' => 0]);

        return response()->json(['ok' => true]);
    }

    /** Pausa o reactiva la IA para una conversación puntual. */
    public function toggleAi(string $waId)
    {
        $convo = WhatsAppConversation::where('wa_id', $waId)->firstOrFail();
        $convo->update(['ai_paused' => ! $convo->ai_paused]);

        return response()->json(['ai_paused' => $convo->ai_paused]);
    }

    /** Archiva o desarchiva una conversación (la saca/vuelve a la lista principal). */
    public function toggleArchive(string $waId)
    {
        $convo = WhatsAppConversation::where('wa_id', $waId)->firstOrFail();
        $convo->update(['archived_at' => $convo->archived_at ? null : now()]);

        return response()->json(['archived' => (bool) $convo->archived_at]);
    }

    /** Elimina la conversación y todos sus mensajes (no se puede deshacer). */
    public function destroy(string $waId)
    {
        WhatsAppMessage::where('wa_id', $waId)->delete();
        WhatsAppConversation::where('wa_id', $waId)->delete();

        return response()->json(['deleted' => true]);
    }

    /** Estado del interruptor general de la IA de WhatsApp (activada/desactivada). */
    public function aiStatus()
    {
        return response()->json(['enabled' => WhatsAppController::aiGloballyEnabled()]);
    }

    /** Activa o desactiva la IA de WhatsApp para todo el negocio. */
    public function toggleGlobalAi()
    {
        $config = WhatsAppController::aiConfig();
        $config['enabled'] = ! $config['enabled'];

        SiteSetting::updateOrCreate(['key' => 'whatsapp_ai'], ['value' => $config]);

        return response()->json(['enabled' => $config['enabled']]);
    }

    private function convoJson(WhatsAppConversation $c): array
    {
        return [
            'waId'         => $c->wa_id,
            'name'         => $c->name,
            'lastMessage'  => $c->last_message,
            'lastAt'       => $c->last_message_at?->toIso8601String(),
            'unread'       => (int) $c->unread,
            'aiPaused'     => (bool) $c->ai_paused,
            'archived'     => (bool) $c->archived_at,
        ];
    }
}

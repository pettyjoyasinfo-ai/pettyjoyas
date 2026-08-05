<?php

namespace App\Services\WhatsApp;

use App\Models\WhatsAppConversation;
use App\Models\WhatsAppMessage;

/**
 * Persistencia de la bandeja de WhatsApp: guarda cada mensaje y mantiene el
 * estado de la conversación (último mensaje, no leídos, si la IA está en pausa).
 */
class WhatsAppInboxService
{
    /** Registra un mensaje entrante del cliente y actualiza la conversación. */
    public function recordInbound(string $waId, ?string $name, ?string $body, string $type, ?string $wamId): WhatsAppConversation
    {
        WhatsAppMessage::create([
            'wa_id'     => $waId,
            'direction' => 'in',
            'sender'    => 'customer',
            'body'      => $body,
            'type'      => $type,
            'wam_id'    => $wamId,
        ]);

        $convo = WhatsAppConversation::firstOrNew(['wa_id' => $waId]);
        if ($name && ! $convo->name) {
            $convo->name = $name;
        }
        $convo->last_message = $this->preview($type, $body);
        $convo->last_message_at = now();
        $convo->unread = ($convo->unread ?? 0) + 1;
        $convo->save();

        return $convo->refresh();
    }

    /** Registra un mensaje saliente (IA o vendedor). No toca los "no leídos". */
    public function recordOutbound(string $waId, string $sender, string $body, ?string $wamId = null): void
    {
        WhatsAppMessage::create([
            'wa_id'     => $waId,
            'direction' => 'out',
            'sender'    => $sender,
            'body'      => $body,
            'type'      => 'text',
            'wam_id'    => $wamId,
        ]);

        $convo = WhatsAppConversation::firstOrNew(['wa_id' => $waId]);
        $convo->last_message = $this->preview('text', $body);
        $convo->last_message_at = now();
        $convo->save();
    }

    /** ¿La IA está pausada para esta conversación (la maneja un humano)? */
    public function isAiPaused(string $waId): bool
    {
        return (bool) WhatsAppConversation::where('wa_id', $waId)->value('ai_paused');
    }

    /** Texto corto para la vista previa en la lista de conversaciones. */
    private function preview(string $type, ?string $body): string
    {
        if ($type !== 'text') {
            return match ($type) {
                'image'    => '📷 Imagen',
                'audio'    => '🎤 Audio',
                'video'    => '🎥 Video',
                'sticker'  => '🌟 Sticker',
                'document' => '📄 Documento',
                'location' => '📍 Ubicación',
                default    => 'Mensaje',
            };
        }

        return mb_substr(trim((string) $body), 0, 120);
    }
}

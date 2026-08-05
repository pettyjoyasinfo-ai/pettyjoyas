<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppConversation extends Model
{
    protected $table = 'whatsapp_conversations';

    protected $fillable = ['wa_id', 'name', 'last_message', 'last_message_at', 'unread', 'ai_paused', 'archived_at'];

    protected $casts = [
        'last_message_at' => 'datetime',
        'archived_at'     => 'datetime',
        'ai_paused'       => 'boolean',
        'unread'          => 'integer',
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(WhatsAppMessage::class, 'wa_id', 'wa_id')->orderBy('id');
    }
}

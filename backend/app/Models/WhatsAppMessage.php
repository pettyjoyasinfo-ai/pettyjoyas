<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsAppMessage extends Model
{
    protected $table = 'whatsapp_messages';

    protected $fillable = ['wa_id', 'direction', 'sender', 'body', 'type', 'wam_id'];
}

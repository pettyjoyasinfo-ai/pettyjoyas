<?php

namespace App\Models;

use App\Enums\BusinessEventType;
use Illuminate\Database\Eloquent\Model;

class SyncEvent extends Model
{
    /** PK es un UUID generado por el cliente (no autoincremental). */
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'type', 'payload', 'status', 'client_created_at', 'processed_at', 'error',
    ];

    protected $casts = [
        'payload' => 'array',
        'type' => BusinessEventType::class,
        'processed_at' => 'datetime',
    ];
}

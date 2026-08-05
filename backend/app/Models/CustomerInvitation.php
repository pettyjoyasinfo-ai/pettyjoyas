<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerInvitation extends Model
{
    public $timestamps = false;

    protected $fillable = ['email', 'token', 'expires_at'];

    protected $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}

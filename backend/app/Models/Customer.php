<?php

namespace App\Models;

use App\Enums\CustomerSegment;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    protected $fillable = [
        'name', 'email', 'phone', 'birthday', 'document',
        'segment', 'vip', 'tags', 'notes', 'user_id', 'reactivation_email_sent_at',
    ];

    protected $casts = [
        'birthday' => 'date',
        'vip' => 'boolean',
        'tags' => 'array',
        'segment' => CustomerSegment::class,
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function newsletterSubscriber(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(\App\Models\NewsletterSubscriber::class);
    }

    /** Vincula o crea el suscriptor de newsletter para este cliente. */
    public function syncNewsletterSubscriber(): void
    {
        if (!$this->email) return;
        \App\Models\NewsletterSubscriber::updateOrCreate(
            ['email' => strtolower($this->email)],
            ['active' => true, 'customer_id' => $this->id, 'name' => $this->name],
        );
    }
}

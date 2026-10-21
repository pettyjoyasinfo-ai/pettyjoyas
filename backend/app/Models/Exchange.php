<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Cambio o devolución hecho desde caja. Guarda qué volvió, qué se entregó y cómo se
 * resolvió la diferencia; no es una venta nueva (ver CreateExchangeAction).
 */
class Exchange extends Model
{
    protected $fillable = [
        'number', 'kind', 'user_id', 'cash_register_id', 'original_order_id', 'ledger_order_id',
        'reason', 'returned_total', 'delivered_total', 'difference', 'settlement', 'payment_method', 'notes',
    ];

    protected $casts = [
        'returned_total' => 'integer',
        'delivered_total' => 'integer',
        'difference' => 'integer',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(ExchangeItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function originalOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'original_order_id');
    }

    public function ledgerOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'ledger_order_id');
    }
}

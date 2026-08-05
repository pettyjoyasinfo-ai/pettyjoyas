<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditNote extends Model
{
    protected $fillable = [
        'number', 'order_id', 'cash_register_id', 'issued_by', 'reason', 'amount', 'items',
    ];

    protected $casts = [
        'items' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    /** Genera el próximo número de nota de crédito (NC-000001). */
    public static function nextNumber(): string
    {
        $last = self::max('id') ?? 0;
        return 'NC-' . str_pad($last + 1, 6, '0', STR_PAD_LEFT);
    }
}

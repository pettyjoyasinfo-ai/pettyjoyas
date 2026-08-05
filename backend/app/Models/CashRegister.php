<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashRegister extends Model
{
    protected $fillable = [
        'opened_by', 'closed_by', 'opened_at', 'closed_at',
        'opening_amount', 'closing_amount', 'expected_cash', 'notes', 'status',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function openedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function creditNotes(): HasMany
    {
        return $this->hasMany(CreditNote::class);
    }

    /** Caja actualmente abierta (debería haber máximo una). */
    public static function current(): ?self
    {
        return self::where('status', 'open')->latest()->first();
    }

    /** Totales de ventas POS realizadas mientras esta caja estuvo (o está) abierta. */
    public function salesSummary(): array
    {
        $to = $this->closed_at ?? now();

        $rows = Order::query()
            ->where('channel', 'local')
            ->whereIn('status', ['pagado', 'entregado'])
            ->whereBetween('created_at', [$this->opened_at, $to])
            ->selectRaw('payment_method, COUNT(*) as cnt, SUM(total) as total')
            ->groupBy('payment_method')
            ->get()
            ->keyBy('payment_method');

        $methods = ['efectivo', 'transferencia', 'tarjeta'];
        $summary = [];
        $grandTotal = 0;
        $grandCount = 0;

        foreach ($methods as $m) {
            $row = $rows[$m] ?? null;
            $t = (int) ($row?->total ?? 0);
            $c = (int) ($row?->cnt ?? 0);
            $summary[$m] = ['count' => $c, 'total' => $t];
            $grandTotal += $t;
            $grandCount += $c;
        }

        $summary['total'] = $grandTotal;
        $summary['count'] = $grandCount;

        return $summary;
    }
}

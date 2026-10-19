<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
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

    /** Zona horaria del negocio (la base y Laravel trabajan en UTC, 3 horas adelantado). */
    public const TZ = \App\Support\BusinessTime::TZ;

    /** Caja actualmente abierta (debería haber máximo una). */
    public static function current(): ?self
    {
        return self::where('status', 'open')->latest()->first();
    }

    /**
     * La caja más reciente que se abrió Y se cerró hoy (día argentino). Si existe, abrir
     * caja de nuevo la CONTINÚA en vez de crear otra: una sola caja por jornada, así el
     * resumen del día no queda repartido entre 3 o 4 cajas.
     */
    public static function closedToday(): ?self
    {
        $today = now(self::TZ)->toDateString();

        return self::where('status', 'closed')
            ->where('closed_at', '>=', now()->subDay())
            ->orderByDesc('closed_at')
            ->get()
            ->first(fn (self $r) => $r->opened_at->copy()->setTimezone(self::TZ)->toDateString() === $today
                && $r->closed_at?->copy()->setTimezone(self::TZ)->toDateString() === $today);
    }

    /** Ventas POS realizadas mientras esta caja estuvo (o está) abierta — base para el resumen y el detalle. */
    public function salesQuery(): Builder
    {
        $to = $this->closed_at ?? now();

        return Order::query()
            ->where('channel', 'local')
            ->whereIn('status', ['pagado', 'entregado'])
            ->whereBetween('created_at', [$this->opened_at, $to]);
    }

    /** Totales de ventas POS realizadas mientras esta caja estuvo (o está) abierta. */
    public function salesSummary(): array
    {
        $rows = $this->salesQuery()
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

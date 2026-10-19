<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\CashRegister;
use App\Models\CreditNote;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashRegisterController extends Controller
{
    // ─── Caja ───────────────────────────────────────────────

    /** GET /pos/cash-register/current — caja actualmente abierta (null si no hay ninguna). */
    public function current(): JsonResponse|\Illuminate\Http\Response
    {
        $register = CashRegister::with(['openedBy'])->where('status', 'open')->latest()->first();

        if (! $register) {
            // 200 con null (antes 204): así el frontend distingue "no hay caja abierta" de
            // "falló la consulta". Un error de red o del servidor no debe mostrar la pantalla
            // de apertura como si la caja se hubiera cerrado sola.
            return $this->jsonNull();
        }

        return response()->json($this->format($register));
    }

    /** GET /pos/cash-register/current/items — productos vendidos durante la caja abierta actual. */
    public function currentItems(): JsonResponse
    {
        $register = CashRegister::current();

        if (! $register) {
            return response()->json([]);
        }

        return response()->json($this->itemsBreakdown($register));
    }

    /**
     * GET /pos/cash-register/last-closed — la caja que se abrió y cerró HOY (null si no hay).
     * El POS la usa para avisar que, al abrir de nuevo, se continúa esa misma caja.
     */
    public function lastClosed(): JsonResponse
    {
        $register = CashRegister::closedToday();

        return $register
            ? response()->json($this->format($register->load(['openedBy', 'closedBy'])))
            : $this->jsonNull();
    }

    /**
     * Respuesta JSON "null". OJO: response()->json(null) devuelve `{}` (un objeto vacío), que el
     * frontend tomaría como una caja existente; hay que mandar el literal null.
     */
    private function jsonNull(): JsonResponse
    {
        return JsonResponse::fromJsonString('null');
    }

    /** POST /pos/cash-register/open — abre una nueva caja (o continúa la que se cerró hoy). */
    public function open(Request $request): JsonResponse
    {
        if (CashRegister::current()) {
            return response()->json(['message' => 'Ya hay una caja abierta.'], 422);
        }

        $data = $request->validate([
            'opening_amount' => ['required', 'integer', 'min:0'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ]);

        // Una sola caja por día: si hoy ya se abrió y cerró una, se la continúa en vez de crear
        // otra (el resumen y el conteo quedan juntos). El efectivo declarado al abrir se anota.
        $same = CashRegister::closedToday();
        if ($same) {
            $hora = now(CashRegister::TZ)->format('H:i');
            $declarado = number_format((int) $data['opening_amount'], 0, ',', '.');
            $same->update([
                'status'         => 'open',
                'closed_at'      => null,
                'closed_by'      => null,
                'closing_amount' => null,
                'expected_cash'  => null,
                'notes'          => trim(($same->notes ? $same->notes."\n" : '')."Continuada {$hora}: efectivo en cajón declarado \${$declarado}"),
            ]);

            return response()->json([...$this->format($same->load('openedBy')), 'continued' => true]);
        }

        $register = CashRegister::create([
            'opened_by'      => $request->user()->id,
            'opened_at'      => now(),
            'opening_amount' => $data['opening_amount'],
            'notes'          => $data['notes'] ?? null,
            'status'         => 'open',
        ]);

        return response()->json($this->format($register->load('openedBy')), 201);
    }

    /** POST /pos/cash-register/close — cierra la caja activa. */
    public function close(Request $request): JsonResponse
    {
        $register = CashRegister::current();

        if (! $register) {
            return response()->json(['message' => 'No hay caja abierta.'], 422);
        }

        $data = $request->validate([
            // null = se cerró SIN contar el efectivo: no hay "diferencia" que informar.
            'closing_amount' => ['nullable', 'integer', 'min:0'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ]);

        $summary      = $register->salesSummary();
        $expectedCash = $register->opening_amount + $summary['efectivo']['total'];

        $register->update([
            'closed_by'      => $request->user()->id,
            'closed_at'      => now(),
            'closing_amount' => $data['closing_amount'] ?? null,
            'expected_cash'  => $expectedCash,
            'notes'          => $data['notes'] ?? $register->notes,
            'status'         => 'closed',
        ]);

        return response()->json([
            ...$this->format($register->load(['openedBy', 'closedBy'])),
            'summary'  => $summary,
            'expected' => $expectedCash,
            'diff'     => isset($data['closing_amount']) ? $data['closing_amount'] - $expectedCash : null,
        ]);
    }

    /** GET /pos/cash-register/history — últimas 30 sesiones de caja. */
    public function history(): JsonResponse
    {
        $registers = CashRegister::with(['openedBy', 'closedBy'])
            ->latest()
            ->take(30)
            ->get()
            ->map(fn (CashRegister $r) => $this->format($r));

        return response()->json($registers);
    }

    /**
     * GET /pos/cash-register/days?dias=7 — ventas del POS por DÍA argentino, sumadas desde los
     * pedidos (no desde las cajas): una caja que cruza la medianoche o que sigue abierta de un
     * día para otro no mezcla las ventas de un día con las del siguiente.
     */
    public function days(Request $request): JsonResponse
    {
        $dias = min(31, max(1, (int) $request->query('dias', 7)));
        $from = now(CashRegister::TZ)->startOfDay()->subDays($dias - 1)->setTimezone(config('app.timezone'));

        // Argentina no usa horario de verano: el desfase con UTC es siempre de 3 horas.
        $rows = Order::query()
            ->where('channel', 'local')
            ->whereIn('status', ['pagado', 'entregado'])
            ->where('created_at', '>=', $from)
            ->selectRaw('DATE(DATE_SUB(created_at, INTERVAL 3 HOUR)) as dia, payment_method, COUNT(*) as cnt, SUM(total) as total')
            ->groupBy('dia', 'payment_method')
            ->get();

        $registers = CashRegister::query()
            ->where('opened_at', '>=', $from)
            ->get(['opened_at'])
            ->groupBy(fn (CashRegister $r) => $r->opened_at->copy()->setTimezone(CashRegister::TZ)->toDateString())
            ->map->count();

        $empty = fn () => ['count' => 0, 'total' => 0];
        $out = [];
        foreach ($rows as $r) {
            $d = $out[$r->dia] ??= [
                'date' => $r->dia, 'count' => 0, 'total' => 0, 'registers' => (int) ($registers[$r->dia] ?? 0),
                'efectivo' => $empty(), 'transferencia' => $empty(), 'tarjeta' => $empty(),
            ];
            $d['count'] += (int) $r->cnt;
            $d['total'] += (int) $r->total;
            if (isset($d[$r->payment_method]) && is_array($d[$r->payment_method])) {
                $d[$r->payment_method]['count'] += (int) $r->cnt;
                $d[$r->payment_method]['total'] += (int) $r->total;
            }
            $out[$r->dia] = $d;
        }
        krsort($out);

        return response()->json(array_values($out));
    }

    /** GET /pos/cash-register/{cashRegister}/sales — detalle de todas las ventas de una sesión de caja. */
    public function sales(CashRegister $cashRegister): JsonResponse
    {
        $orders = $cashRegister->salesQuery()
            ->with(['items', 'customer'])
            ->latest()
            ->get();

        return OrderResource::collection($orders)->response();
    }

    // ─── Notas de crédito ───────────────────────────────────

    /** POST /pos/credit-notes — emite una nota de crédito. */
    public function storeCreditNote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_number' => ['required', 'string'],
            'reason'       => ['required', 'string', 'max:500'],
            'amount'       => ['required', 'integer', 'min:1'],
            'items'        => ['nullable', 'array'],
        ]);

        $order = Order::where('number', $data['order_number'])->first();

        if (! $order) {
            return response()->json(['message' => 'Pedido no encontrado.'], 422);
        }

        $note = CreditNote::create([
            'number'           => CreditNote::nextNumber(),
            'order_id'         => $order->id,
            'cash_register_id' => CashRegister::current()?->id,
            'issued_by'        => $request->user()->id,
            'reason'           => $data['reason'],
            'amount'           => $data['amount'],
            'items'            => $data['items'] ?? null,
        ]);

        return response()->json($note->load(['order', 'issuedBy']), 201);
    }

    /** GET /pos/credit-notes — últimas 50 notas de crédito. */
    public function indexCreditNotes(): JsonResponse
    {
        $notes = CreditNote::with(['order', 'issuedBy'])
            ->latest()
            ->take(50)
            ->get()
            ->map(fn (CreditNote $n) => [
                'id'           => $n->id,
                'number'       => $n->number,
                'order_number' => $n->order->number,
                'reason'       => $n->reason,
                'amount'       => $n->amount,
                'items'        => $n->items,
                'issued_by'    => $n->issuedBy?->name,
                'created_at'   => $n->created_at,
            ]);

        return response()->json($notes);
    }

    // ─── Helpers ────────────────────────────────────────────

    private function format(CashRegister $r): array
    {
        $summary = $r->salesSummary();

        return [
            'id'             => $r->id,
            'status'         => $r->status,
            'opened_at'      => $r->opened_at,
            'closed_at'      => $r->closed_at,
            'opening_amount' => $r->opening_amount,
            'closing_amount' => $r->closing_amount,
            'expected_cash'  => $r->expected_cash,
            'notes'          => $r->notes,
            'opened_by'      => $r->openedBy?->name,
            'closed_by'      => $r->closedBy?->name,
            'summary'        => $summary,
        ];
    }

    /** Agrupa los items vendidos en la sesión por producto+variante (cantidad y monto totales). */
    private function itemsBreakdown(CashRegister $register): array
    {
        $orderIds = $register->salesQuery()->pluck('id');

        return OrderItem::query()
            ->whereIn('order_id', $orderIds)
            ->get()
            // Ventas manuales: sin product_id, se agrupan por descripción (si no, todas
            // quedarían juntas bajo la misma clave y se mostraría solo el nombre de la primera).
            ->groupBy(fn (OrderItem $it) => ($it->product_id ?? 'manual:'.$it->name).'-'.$it->product_variant_id)
            ->map(function ($group) {
                $first = $group->first();

                return [
                    'productId'    => $first->product_id,
                    'name'         => $first->name,
                    'variantLabel' => $first->variant_label,
                    'image'        => $first->image,
                    'quantity'     => (int) $group->sum('quantity'),
                    'total'        => (int) $group->sum(fn (OrderItem $it) => $it->unit_price * $it->quantity),
                ];
            })
            ->sortByDesc('quantity')
            ->values()
            ->toArray();
    }
}

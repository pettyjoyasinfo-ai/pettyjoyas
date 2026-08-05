<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use App\Models\CreditNote;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CashRegisterController extends Controller
{
    // ─── Caja ───────────────────────────────────────────────

    /** GET /pos/cash-register/current — caja actualmente abierta (204 si no hay ninguna). */
    public function current(): JsonResponse|\Illuminate\Http\Response
    {
        $register = CashRegister::with(['openedBy'])->where('status', 'open')->latest()->first();

        if (! $register) {
            return response()->noContent(); // 204 → apiFetch devuelve undefined → gate "Abrir caja"
        }

        return response()->json($this->format($register));
    }

    /** POST /pos/cash-register/open — abre una nueva caja. */
    public function open(Request $request): JsonResponse
    {
        if (CashRegister::current()) {
            return response()->json(['message' => 'Ya hay una caja abierta.'], 422);
        }

        $data = $request->validate([
            'opening_amount' => ['required', 'integer', 'min:0'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ]);

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
            'closing_amount' => ['required', 'integer', 'min:0'],
            'notes'          => ['nullable', 'string', 'max:500'],
        ]);

        $summary      = $register->salesSummary();
        $expectedCash = $register->opening_amount + $summary['efectivo']['total'];

        $register->update([
            'closed_by'      => $request->user()->id,
            'closed_at'      => now(),
            'closing_amount' => $data['closing_amount'],
            'expected_cash'  => $expectedCash,
            'notes'          => $data['notes'] ?? $register->notes,
            'status'         => 'closed',
        ]);

        return response()->json([
            ...$this->format($register->load(['openedBy', 'closedBy'])),
            'summary'  => $summary,
            'expected' => $expectedCash,
            'diff'     => $data['closing_amount'] - $expectedCash,
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
}

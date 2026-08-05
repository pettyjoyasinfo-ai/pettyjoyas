<?php

namespace App\Http\Controllers\Api;

use App\Actions\Sales\CreateSaleAction;
use App\Actions\Sales\EditSaleAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Payments\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PosController extends Controller
{
    /**
     * Venta presencial (staff). Canal local; descuenta el mismo stock unificado.
     *
     * Métodos de pago en POS:
     *  - efectivo → pagado inmediatamente (dinero en mano).
     *  - tarjeta → pagado inmediatamente (se cobra con posnet física; el botón solo segmenta la venta).
     *  - transferencia → orden pendiente, se muestra alias para que el cliente transfiera.
     *
     * Los ingresos quedan separados porque cada Order tiene channel='local' y
     * payment_method diferente. El reporte de ingresos agrupa por ambos campos.
     */
    public function store(StoreSaleRequest $request, CreateSaleAction $action, PaymentService $payments)
    {
        $data  = ['channel' => 'local', ...$request->validated()];
        $order = $action->execute($data, $request->user()->id);

        $payment = match ($order->payment_method) {
            'transferencia' => $payments->getTransferInfo(),
            default         => null, // efectivo/tarjeta: ya está pagado
        };

        // Comprobante al cliente si está vinculado (sin avisar al admin: la venta la hace él).
        $transfer = $order->payment_method === 'transferencia' ? ($payment ?? []) : [];
        \App\Support\Mailer::orderPlaced($order, $transfer, notifyAdmin: false);

        return response()->json([
            'order'   => new OrderResource($order),
            'payment' => $payment,
        ], 201);
    }

    /** Admin confirma que llegó la transferencia de una venta POS. */
    public function confirmTransfer(Request $request, Order $order, PaymentService $payments)
    {
        abort_if($order->channel?->value !== 'local', 403, 'Solo para ventas POS.');

        $request->validate(['notes' => ['nullable', 'string', 'max:500']]);
        $payments->confirmTransferPayment($order, $request->notes);

        \App\Support\Mailer::orderPaid($order->fresh(['customer', 'items']));

        return new OrderResource($order->fresh(['customer', 'items']));
    }

    /**
     * Corrige medio de pago y/o monto de una venta presencial ya cargada
     * (ej. el cajero tocó "efectivo" en vez de "tarjeta", o tipeó mal el
     * total). No requiere cerrar ni reabrir caja — el resumen del día y el
     * historial de cajas se calculan en vivo, así que el cambio se refleja
     * solo. No toca los productos vendidos ni el stock, solo cómo quedó
     * registrado el cobro.
     */
    public function editSale(Request $request, Order $order, EditSaleAction $action)
    {
        abort_if($order->channel?->value !== 'local', 403, 'Solo se pueden editar ventas presenciales.');

        $data = $request->validate([
            'payment_method' => ['sometimes', Rule::in(['efectivo', 'tarjeta', 'transferencia'])],
            'total' => ['sometimes', 'integer', 'min:0'],
        ]);

        $order = $action->execute($order, $data['payment_method'] ?? null, $data['total'] ?? null);

        return new OrderResource($order);
    }

    /** Resumen de ingresos POS del día (para la pantalla del cajero). */
    public function dailySummary()
    {
        $rows = Order::query()
            ->where('channel', 'local')
            ->whereIn('status', ['pagado', 'entregado'])
            ->whereDate('created_at', today())
            ->selectRaw('payment_method, COUNT(*) as count, SUM(total) as total')
            ->groupBy('payment_method')
            ->get()
            ->keyBy('payment_method');

        return response()->json([
            'efectivo'      => ['count' => (int) ($rows['efectivo']->count ?? 0),      'total' => (int) ($rows['efectivo']->total ?? 0)],
            'transferencia' => ['count' => (int) ($rows['transferencia']->count ?? 0), 'total' => (int) ($rows['transferencia']->total ?? 0)],
            'tarjeta'       => ['count' => (int) ($rows['tarjeta']->count ?? 0),       'total' => (int) ($rows['tarjeta']->total ?? 0)],
        ]);
    }
}

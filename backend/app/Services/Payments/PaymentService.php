<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\Sales\SalesService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Integración con MercadoPago (Checkout Pro) y lógica de tarjeta (POS),
 * transferencia y efectivo.
 *
 * Flujos soportados:
 *  - mercadopago (online): genera preferencia Checkout Pro → redirige → webhook confirma.
 *  - tarjeta (POS): solo segmenta la venta como pagada con tarjeta (se cobra con posnet física, no hay integración).
 *  - transferencia (online/POS): genera orden pendiente → devuelve alias → admin confirma.
 *  - efectivo POS: orden aprobada en el momento (sin pasos extra).
 *  - efectivo + retiro (online): orden en estado "reserva" → se confirma al retirar.
 */
class PaymentService
{
    public function __construct(private SalesService $sales) {}

    private function token(): ?string
    {
        return config('services.mercadopago.token');
    }

    // ─── Preferencia MercadoPago ───────────────────────────────────────────

    public function createMercadoPagoPreference(Order $order): array
    {
        if (! $this->token()) {
            return [
                'type'         => 'mercadopago',
                'simulated'    => true,
                'init_point'   => url("/api/payments/mercadopago/simulate/{$order->number}"),
                'preference_id' => 'SIMULATED-'.$order->number,
            ];
        }

        // Los precios se guardan en pesos enteros (no centavos): se envían tal cual.
        $items = $order->items->map(fn ($it) => [
            'title'      => $it->name.($it->variant_label ? " ({$it->variant_label})" : ''),
            'quantity'   => (int) $it->quantity,
            'unit_price' => (float) $it->unit_price,
            'currency_id' => 'ARS',
        ])->all();

        // El costo de envío va como ítem extra para que el total coincida.
        if ((int) $order->shipping_cost > 0) {
            $items[] = [
                'title'       => 'Envío',
                'quantity'    => 1,
                'unit_price'  => (float) $order->shipping_cost,
                'currency_id' => 'ARS',
            ];
        }

        // MP no admite ítems con precio negativo: si hay descuento (cupón),
        // consolidamos todo en un único ítem con el total real a cobrar.
        if ((int) $order->discount > 0) {
            $items = [[
                'title'       => 'Pedido '.$order->number,
                'quantity'    => 1,
                'unit_price'  => (float) $order->total,
                'currency_id' => 'ARS',
            ]];
        }

        $response = Http::withToken($this->token())
            ->post('https://api.mercadopago.com/checkout/preferences', [
                'items'              => $items,
                'external_reference' => $order->number,
                'back_urls' => [
                    'success' => config('app.frontend_url').'/pedido-confirmado?order='.$order->number.'&status=approved',
                    'pending' => config('app.frontend_url').'/pedido-confirmado?order='.$order->number.'&status=pending',
                    'failure' => config('app.frontend_url').'/checkout?payment_failed=1',
                ],
                'auto_return'        => 'approved',
                'notification_url'   => url('/api/payments/mercadopago/webhook'),
                'statement_descriptor' => 'PETTY JOYAS',
            ]);

        if ($response->failed()) {
            Log::error('MP preference error', ['body' => $response->body()]);
            throw new \RuntimeException('No se pudo crear la preferencia de pago.');
        }

        $data = $response->json();

        return [
            'type'         => 'mercadopago',
            'simulated'    => false,
            'init_point'   => $data['init_point'],
            'preference_id' => $data['id'],
        ];
    }

    // ─── Webhook de MercadoPago ────────────────────────────────────────────

    /**
     * Procesa la notificación IPN/webhook REAL de MP.
     * MP envía distintos formatos ("payment.updated" con data.id, o eventos de
     * merchant_order que sí incluyen external_reference directo) — pero en
     * NINGÚN caso confiamos en el status que venga en el payload entrante:
     * siempre se re-consulta el pago real contra la API de MP con su id antes
     * de aprobar nada. Un merchant_order llega apenas el cliente ABRE el
     * checkout (antes de pagar) — si acá se aprobara solo por tener
     * external_reference, se marcaría pagado sin haber cobrado un peso.
     */
    public function handleWebhook(array $payload): void
    {
        // IPN de "payment": { "data": { "id": "123" } } o { "id": "123" } directo.
        $dataId = $payload['data']['id'] ?? (($payload['type'] ?? null) === 'payment' ? ($payload['id'] ?? null) : null);

        if ($dataId) {
            $mpPayment = $this->fetchMpPayment((string) $dataId);
            if (! $mpPayment) return;

            $reference = $mpPayment['external_reference'] ?? null;
            $status    = $mpPayment['status'] ?? null;
            if (! $reference) return;

            if ($status === 'approved') {
                $this->markOrderPaid($reference, (string) $dataId, $mpPayment);
            } elseif (in_array($status, ['rejected', 'cancelled', 'refunded', 'charged_back'], true)) {
                $this->markOrderCancelled($reference, (string) $dataId, $mpPayment);
            }
            // 'pending' / 'in_process': no hacemos nada, esperamos la confirmación.
            return;
        }

        // Notificación de merchant_order: trae el/los pagos asociados a la
        // preferencia. Se revisa cada pago real por su id — nunca se aprueba
        // por la sola presencia de external_reference en este payload.
        $payments = $payload['payments'] ?? null;
        if (is_array($payments)) {
            foreach ($payments as $p) {
                if (! empty($p['id'])) {
                    $this->handleWebhook(['type' => 'payment', 'id' => $p['id']]);
                }
            }
        }
    }

    /**
     * SOLO para /payments/mercadopago/simulate (gateado a local/staging en el
     * controller) — marca un pedido pagado sin ir a la API real de MP. Nunca
     * debe ser alcanzable desde el webhook público en producción.
     */
    public function simulateApproval(string $orderNumber, string $simulatedId): void
    {
        $this->markOrderPaid($orderNumber, $simulatedId, ['simulated' => true]);
    }

    private function fetchMpPayment(string $id): ?array
    {
        if (! $this->token()) return null;

        $response = Http::withToken($this->token())
            ->get("https://api.mercadopago.com/v1/payments/{$id}");

        if ($response->failed()) {
            Log::warning("MP fetch payment failed for id={$id}", ['status' => $response->status()]);
            return null;
        }

        return $response->json();
    }

    private function markOrderPaid(string $orderNumber, ?string $mpPaymentId, array $raw): void
    {
        $order = Order::where('number', $orderNumber)->first();
        if (! $order) return;

        // Idempotencia: si ya estaba pagada, no reprocesamos (MP reintenta webhooks).
        if ($order->payment_status === 'aprobado') return;

        // El stock de un pedido online por MercadoPago recién se descuenta
        // acá, con el pago ya confirmado de verdad — CreateSaleAction lo
        // difiere justamente para no descontar stock de compras que el
        // cliente nunca termina de pagar.
        $order->loadMissing('items');
        foreach ($order->items as $item) {
            if ($item->product_variant_id) {
                ProductVariant::where('id', $item->product_variant_id)->decrement('stock', abs((int) $item->quantity));
            } elseif ($item->product_id) {
                Product::where('id', $item->product_id)->decrement('stock', abs((int) $item->quantity));
            }
        }

        $order->update([
            'payment_status' => 'aprobado',
            'status'         => 'pagado',
        ]);

        // Actualizar o crear el registro de pago
        $payment = $order->payments()->latest()->first();
        if ($payment) {
            $payment->update([
                'status'              => 'aprobado',
                'provider_payment_id' => $mpPaymentId,
                'raw'                 => $raw,
            ]);
        } else {
            $order->payments()->create([
                'provider'            => 'mercadopago',
                'provider_payment_id' => $mpPaymentId,
                'status'              => 'aprobado',
                'amount'              => $order->total,
                'raw'                 => $raw,
            ]);
        }

        // Avisa al cliente que el pago se acreditó — y ahora también al
        // admin (a este pedido no se le avisó nada al crearse: recién acá
        // sabemos que se pagó de verdad).
        \App\Support\Mailer::orderPaid($order->fresh(['customer', 'items']), notifyAdmin: true);
    }

    /**
     * Marca una orden como cancelada por pago fallido/devuelto y repone el stock.
     * Idempotente: si ya estaba cancelada, no repone de nuevo (el stock se
     * descontó una sola vez al crear la orden).
     */
    private function markOrderCancelled(string $orderNumber, ?string $mpPaymentId, array $raw): void
    {
        $order = Order::with('items')->where('number', $orderNumber)->first();
        if (! $order) return;
        if ($order->status === \App\Enums\OrderStatus::Cancelado) return;

        $this->sales->restockOrder($order);

        $order->update([
            'payment_status' => 'rechazado',
            'status'         => 'cancelado',
        ]);

        $payment = $order->payments()->latest()->first();
        if ($payment) {
            $payment->update([
                'status'              => 'rechazado',
                'provider_payment_id' => $mpPaymentId,
                'raw'                 => $raw,
            ]);
        }
    }

    // ─── Transferencia ────────────────────────────────────────────────────

    /** Datos bancarios que se muestran al cliente para hacer la transferencia. */
    public function getTransferInfo(): array
    {
        return [
            'type'    => 'transferencia',
            'alias'   => config('services.transfer.alias'),
            'cbu'     => config('services.transfer.cbu'),
            'bank'    => config('services.transfer.bank'),
            'holder'  => config('services.transfer.holder'),
            'whatsapp' => config('services.whatsapp.phone_id') ?? env('PETTY_WA_NUMBER', ''),
        ];
    }

    /** Admin confirma manualmente el comprobante de transferencia. */
    public function confirmTransferPayment(Order $order, ?string $notes = null): void
    {
        $order->update([
            'payment_status' => 'aprobado',
            'status'         => 'pagado',
            'notes'          => $notes ? ($order->notes ? $order->notes."\n".$notes : $notes) : $order->notes,
        ]);

        $payment = $order->payments()->latest()->first();
        if ($payment) {
            $payment->update(['status' => 'aprobado']);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Payments\PaymentService;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private PaymentService $payments) {}

    /**
     * Webhook de MercadoPago (IPN).
     * MP envía { "action": "payment.updated", "data": { "id": "123" } }.
     * La verificación de firma (X-Signature) requiere MP_WEBHOOK_SECRET en .env.
     */
    public function webhook(Request $request)
    {
        // Verificación de firma opcional (cuando MP_WEBHOOK_SECRET esté configurado).
        $secret = config('services.mercadopago.webhook_secret');
        if ($secret) {
            $xSignature = $request->header('X-Signature', '');
            $xRequestId = $request->header('X-Request-Id', '');
            $dataId     = $request->input('data.id', '');

            // Formato: ts=...,v1=...
            $parts = [];
            foreach (explode(',', $xSignature) as $part) {
                [$k, $v] = array_pad(explode('=', $part, 2), 2, '');
                $parts[$k] = $v;
            }

            $ts       = $parts['ts'] ?? '';
            $received = $parts['v1'] ?? '';
            $manifest = "id:{$dataId};request-id:{$xRequestId};ts:{$ts};";
            $expected = hash_hmac('sha256', $manifest, $secret);

            if (! hash_equals($expected, $received)) {
                return response()->json(['error' => 'Invalid signature'], 401);
            }
        }

        $this->payments->handleWebhook($request->all());

        return response()->json(['ok' => true]);
    }

    /**
     * Simula la aprobación de un pago (solo para pruebas locales).
     * Nunca debe existir en producción sin protección adicional.
     */
    public function simulate(string $number)
    {
        abort_unless(app()->environment('local', 'staging'), 403);

        $order = Order::where('number', $number)->firstOrFail();
        $this->payments->simulateApproval($number, 'SIM-'.$number);

        return response()->json([
            'message' => 'Pago simulado aprobado',
            'order'   => $order->number,
            'status'  => 'pagado',
        ]);
    }

    /**
     * Admin confirma manualmente el pago por transferencia (online o POS).
     * PATCH /orders/{order}/confirm-payment
     */
    public function confirmPayment(Request $request, Order $order)
    {
        abort_if(
            ! in_array($order->payment_method, ['transferencia', 'efectivo', 'tarjeta_credito']),
            422,
            'Solo se confirman manualmente transferencias, efectivo y tarjeta de crédito por WhatsApp.'
        );

        $request->validate(['notes' => ['nullable', 'string', 'max:500']]);

        $this->payments->confirmTransferPayment($order, $request->notes);

        return new OrderResource($order->fresh(['customer', 'items', 'payments']));
    }

    /**
     * Datos de transferencia (alias, CBU, banco) para mostrar al cliente o en el POS.
     * GET /payments/transfer-info (público)
     */
    public function transferInfo()
    {
        return response()->json($this->payments->getTransferInfo());
    }
}

<?php

namespace App\Actions\Sales;

use App\Models\Order;
use App\Services\Sales\SalesService;
use Illuminate\Support\Facades\DB;

/**
 * Venta manual del POS: registra un cobro de algo que no está cargado como
 * producto (descripción libre + monto + medio de pago).
 *
 * Es una venta presencial más (channel=local, ya pagada), así que entra sola
 * en el resumen del día, en la caja abierta y en los reportes por medio de
 * pago. Se diferencia de una venta normal en que su único renglón no tiene
 * product_id, y por eso NO toca stock: no hay nada que descontar.
 */
class CreateManualSaleAction
{
    public function __construct(private SalesService $sales) {}

    /**
     * @param  array{description: string, amount: int, payment_method: string, notes?: ?string}  $data
     */
    public function execute(array $data, int $userId): Order
    {
        return DB::transaction(function () use ($data, $userId) {
            $amount = (int) $data['amount'];
            $method = $data['payment_method'];

            $order = Order::create([
                'number' => 'TMP',
                'channel' => 'local',
                'customer_id' => null,
                'user_id' => $userId,
                'status' => 'pagado',
                'payment_method' => $method,
                'payment_status' => 'aprobado',
                'shipping_method' => null,
                'subtotal' => $amount,
                'discount' => 0,
                'shipping_cost' => 0,
                'total' => $amount,
                'coupon_code' => null,
                'address' => null,
                'notes' => $data['notes'] ?? null,
            ]);
            $order->update(['number' => $this->sales->generateNumber($order->id)]);

            $order->items()->create([
                'product_id' => null,
                'product_variant_id' => null,
                'name' => $data['description'],
                'variant_label' => null,
                'image' => null,
                'unit_price' => $amount,
                'quantity' => 1,
            ]);

            $order->payments()->create([
                'provider' => $method,
                'status' => 'aprobado',
                'amount' => $amount,
            ]);

            return $order->load(['items', 'customer', 'payments']);
        });
    }
}

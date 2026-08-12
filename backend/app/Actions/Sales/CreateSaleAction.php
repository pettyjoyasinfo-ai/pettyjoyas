<?php

namespace App\Actions\Sales;

use App\Models\CouponRedemption;
use App\Models\Order;
use App\Services\Customers\CustomerService;
use App\Services\Sales\SalesService;
use Illuminate\Support\Facades\DB;

/**
 * Crea una venta (online o presencial), decrementando stock directamente
 * y aplicando el cupón.
 */
class CreateSaleAction
{
    public function __construct(
        private SalesService $sales,
        private CustomerService $customers,
    ) {}

    public function execute(array $data, ?int $userId = null, ?int $excludeCartId = null): Order
    {
        return DB::transaction(function () use ($data, $userId, $excludeCartId) {
            $channel = $data['channel'] ?? 'online';

            $resolved = $this->sales->resolveItems($data['items']);
            $lines = $resolved['lines'];
            $subtotal = $resolved['subtotal'];

            // Valida stock real (derivado de movimientos) antes de vender.
            // $excludeCartId: no restar la propia reserva del comprador.
            $this->sales->assertStock($lines, $excludeCartId);

            // Cupón.
            $couponResult = $this->sales->couponDiscount($data['coupon_code'] ?? null, $subtotal);
            $couponDiscount = $couponResult['discount'];
            $coupon = $couponResult['coupon'];

            $paymentMethod = $data['payment_method'] ?? null;

            // Descuento por transferencia (config de /admin/configuracion), sobre
            // el subtotal ya con el cupón aplicado. Separado del cupón para no
            // inflar el monto registrado en CouponRedemption más abajo.
            $transferDiscount = $this->sales->transferDiscount($paymentMethod, $subtotal - $couponDiscount);
            $discount = $couponDiscount + $transferDiscount;

            // Cliente (vínculo por email → historial unificado).
            $customer = $this->customers->resolveByEmail($data['customer'] ?? null);

            // Envío.
            $shipping = $this->sales->shippingCost($channel, $data['shipping_method'] ?? null, $subtotal - $discount);
            $total = max(0, $subtotal - $discount + $shipping);

            // Estado inicial según canal + método de pago:
            //  - POS efectivo/tarjeta/transferencia → pagado: en el local el cajero ya
            //    tiene la plata en mano o ya verificó que la transferencia entró (el
            //    botón dice "Confirmar transferencia recibida", no "voy a esperar a que
            //    llegue") — a diferencia de la transferencia ONLINE, donde el pedido se
            //    crea antes de que el cliente transfiera nada.
            //  - Online efectivo + retiro → reserva (el cliente retira luego)
            //  - Todo lo demás → pendiente (MP webhook o confirmación manual de transfer)
            $shippingMethod = $data['shipping_method'] ?? null;
            $initialStatus = match (true) {
                $channel === 'local' && in_array($paymentMethod, ['efectivo', 'tarjeta', 'transferencia'], true) => 'pagado',
                $paymentMethod === 'efectivo' && $shippingMethod === 'retiro' => 'reserva',
                default => 'pendiente',
            };
            $initialPaymentStatus = $initialStatus === 'pagado' ? 'aprobado' : 'pendiente';

            // Crea la orden (el número se asigna tras conocer el id).
            $order = Order::create([
                'number' => 'TMP',
                'channel' => $channel,
                'customer_id' => $customer?->id,
                'user_id' => $userId,
                'status' => $initialStatus,
                'payment_method' => $paymentMethod,
                'payment_status' => $initialPaymentStatus,
                'shipping_method' => $shippingMethod,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_cost' => $shipping,
                'total' => $total,
                'coupon_code' => $coupon?->code,
                'address' => $data['address'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);
            $order->update(['number' => $this->sales->generateNumber($order->id)]);

            // MercadoPago (online): el pedido queda "pendiente" esperando el
            // pago real, así que el stock NO se descuenta acá — recién se
            // descuenta cuando el webhook confirma el pago de verdad (ver
            // PaymentService::markOrderPaid). Evita vender stock de un pedido
            // que el cliente nunca terminó de pagar. Todo lo demás (efectivo,
            // transferencia, tarjeta POS) sigue descontando al toque, como
            // siempre.
            $deferStock = $channel === 'online' && $paymentMethod === 'mercadopago';

            // Ítems + descuento de stock (movimiento SALE, ligado a la orden).
            foreach ($lines as $line) {
                $order->items()->create([
                    'product_id' => $line['product']->id,
                    'product_variant_id' => $line['variant']->id ?? null,
                    'name' => $line['name'],
                    'variant_label' => $line['variant_label'],
                    'image' => $line['image'] ?? null,
                    'unit_price' => $line['unit_price'],
                    'quantity' => $line['quantity'],
                ]);

                if (! $deferStock) {
                    if ($line['variant']) {
                        $line['variant']->decrement('stock', abs($line['quantity']));
                    } else {
                        $line['product']->decrement('stock', abs($line['quantity']));
                    }
                }
            }

            // Registro del cupón (solo su parte del descuento, sin mezclar
            // con el de transferencia).
            if ($coupon && $couponDiscount > 0) {
                CouponRedemption::create([
                    'coupon_id' => $coupon->id,
                    'order_id' => $order->id,
                    'customer_id' => $customer?->id,
                    'amount' => $couponDiscount,
                ]);
                $coupon->increment('used_count');
            }

            // Registro del pago con el estado inicial correcto.
            $order->payments()->create([
                'provider' => $paymentMethod ?? 'efectivo',
                'status'   => $initialPaymentStatus,
                'amount'   => $total,
            ]);

            if ($customer) {
                $this->customers->recomputeSegment($customer);
            }

            return $order->load(['items', 'customer', 'payments']);
        });
    }
}

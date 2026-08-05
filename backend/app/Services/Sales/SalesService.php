<?php

namespace App\Services\Sales;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SiteSetting;
use App\Services\Inventory\InventoryService;
use Illuminate\Support\Facades\DB;

class SalesService
{
    public function __construct(private InventoryService $inventory) {}

    /**
     * Resuelve los ítems a partir de [{product_id, product_variant_id?, quantity}],
     * calculando precio unitario (precio + delta de variante) y nombre.
     *
     * @return array{lines: array<int,array>, subtotal: int}
     */
    public function resolveItems(array $items): array
    {
        $lines = [];
        $subtotal = 0;

        foreach ($items as $it) {
            $product = Product::with('variants')->findOrFail($it['product_id']);
            $variant = isset($it['product_variant_id'])
                ? $product->variants->firstWhere('id', $it['product_variant_id'])
                : null;

            $unit = $product->price + ($variant->price_delta ?? 0);
            $qty = (int) $it['quantity'];
            $subtotal += $unit * $qty;

            $lines[] = [
                'product' => $product,
                'variant' => $variant,
                'name' => $product->name,
                'variant_label' => $variant?->label,
                'unit_price' => $unit,
                'quantity' => $qty,
            ];
        }

        return ['lines' => $lines, 'subtotal' => $subtotal];
    }

    /** Verifica stock disponible para todas las líneas. Lanza si falta. */
    /**
     * $excludeCartId: el carrito propio del comprador (si lo tiene) — sin
     * esto, la reserva que él mismo hizo al agregar el producto a SU carrito
     * se restaba de la disponibilidad y podía dar "stock insuficiente" sobre
     * el mismísimo producto que está por comprar.
     */
    public function assertStock(array $lines, ?int $excludeCartId = null): void
    {
        foreach ($lines as $line) {
            $available = $this->inventory->currentStock(
                $line['product']->id,
                $line['variant']->id ?? null,
                $excludeCartId,
            );
            if ($available < $line['quantity']) {
                abort(422, "Stock insuficiente de {$line['name']} (disponible: {$available}).");
            }
        }
    }

    /**
     * El envío ya no se cobra automático en el checkout: el costo real se
     * coordina aparte con el cliente (WhatsApp/email) cuando corresponde.
     */
    public function shippingCost(string $channel, ?string $method, int $subtotalAfterDiscount): int
    {
        return 0;
    }

    /**
     * Descuento adicional por pagar con transferencia (config de
     * /admin/configuracion → Métodos de pago). Se calcula sobre el subtotal
     * ya con el cupón aplicado, para no descontar dos veces sobre el bruto.
     */
    public function transferDiscount(?string $paymentMethod, int $subtotalAfterCoupon): int
    {
        if ($paymentMethod !== 'transferencia') {
            return 0;
        }

        $pct = (int) (SiteSetting::allWithDefaults()['payment']['descuento_transferencia'] ?? 0);

        return $pct > 0 ? (int) round($subtotalAfterCoupon * $pct / 100) : 0;
    }

    public function couponDiscount(?string $code, int $subtotal): array
    {
        if (! $code) {
            return ['coupon' => null, 'discount' => 0];
        }

        $coupon = Coupon::whereRaw('UPPER(code) = ?', [strtoupper($code)])->first();
        if (! $coupon || ! $coupon->isUsable()) {
            return ['coupon' => null, 'discount' => 0];
        }

        return ['coupon' => $coupon, 'discount' => $coupon->discountFor($subtotal)];
    }

    public function generateNumber(int $orderId): string
    {
        return 'PJ-'.str_pad((string) $orderId, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Repone al inventario el stock de una orden (al cancelarla o si el pago
     * fue rechazado). El stock se descuenta al crear la orden, así que reponer
     * sólo corresponde una vez: el caller debe garantizar que la orden no estaba
     * ya cancelada (ver OrderController::updateStatus y el webhook de MP).
     */
    public function restockOrder(Order $order): void
    {
        // MercadoPago que nunca llegó a pagarse: el stock no se había
        // descontado todavía (ver CreateSaleAction/markOrderPaid), así que
        // no hay nada que reponer acá — reponerlo inflaría el stock real.
        if ($order->payment_method === 'mercadopago' && $order->payment_status !== 'aprobado') {
            return;
        }

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                if ($item->product_variant_id) {
                    ProductVariant::where('id', $item->product_variant_id)
                        ->increment('stock', abs((int) $item->quantity));
                } elseif ($item->product_id) {
                    Product::where('id', $item->product_id)
                        ->increment('stock', abs((int) $item->quantity));
                }
            }
        });
    }
}

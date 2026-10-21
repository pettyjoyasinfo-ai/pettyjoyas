<?php

namespace App\Actions\Sales;

use App\Models\CashRegister;
use App\Models\Exchange;
use App\Models\ExchangeItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\Sales\SalesService;
use Illuminate\Support\Facades\DB;

/**
 * Cambio o devolución desde caja.
 *
 * NO es una venta nueva: lo devuelto vuelve al stock (si es apto para reventa), lo
 * entregado sale del stock, y en caja solo entra (o sale) la DIFERENCIA de valor.
 *
 *  - Sin diferencia: no se mueve plata, solo queda el registro del cambio.
 *  - El cliente paga la diferencia (o hay un reintegro por caja): se asienta un pedido
 *    `kind = cambio|devolucion` con total = diferencia (negativo si se reintegra), igual
 *    que una venta manual (un único renglón sin producto, no toca stock). Así el resumen
 *    del día, la caja abierta y los reportes suman la diferencia sin contarla como venta.
 *  - Diferencia a favor del cliente que no se reintegra: queda como saldo a favor en el
 *    registro del cambio (no mueve caja).
 */
class CreateExchangeAction
{
    public function __construct(private SalesService $sales) {}

    /**
     * @param  array<string,mixed>  $data  validado por StoreExchangeRequest
     */
    public function execute(array $data, int $userId): Exchange
    {
        return DB::transaction(function () use ($data, $userId) {
            $deliveredInput = $data['delivered'] ?? [];
            $kind = $deliveredInput ? 'cambio' : 'devolucion';

            $original = $this->findOriginalOrder($data['original_order_number'] ?? null);
            $returnable = $original ? $this->returnableByKey($original) : null;

            // ── Artículos devueltos ────────────────────────────────────────
            $inLines = [];
            $returnedTotal = 0;
            foreach ($data['returned'] as $r) {
                [$product, $variant] = $this->resolve((int) $r['product_id'], $r['product_variant_id'] ?? null);
                $qty = (int) $r['quantity'];
                $name = $product->name.($variant ? ' · '.$variant->label : '');

                if ($returnable !== null) {
                    $key = $product->id.'-'.($variant?->id ?? 0);
                    $left = $returnable[$key] ?? 0;
                    if ($left < $qty) {
                        abort(422, $left === 0
                            ? "{$name} no figura en la venta {$original->number} (o ya se devolvió completo)."
                            : "De {$name} solo se pueden devolver {$left} unidad(es) de la venta {$original->number}.");
                    }
                    $returnable[$key] = $left - $qty;
                }

                $inLines[] = [
                    'product' => $product,
                    'variant' => $variant,
                    'quantity' => $qty,
                    'unit_price' => (int) $r['unit_price'],
                    'restock' => (bool) $r['restock'],
                ];
                $returnedTotal += (int) $r['unit_price'] * $qty;
            }

            // Primero se repone lo devuelto: si el cliente cambia una pieza por otra
            // de la misma variante, esa unidad ya cuenta como disponible.
            foreach ($inLines as $l) {
                if (! $l['restock']) {
                    continue;
                }
                if ($l['variant']) {
                    ProductVariant::where('id', $l['variant']->id)->increment('stock', $l['quantity']);
                } else {
                    Product::where('id', $l['product']->id)->increment('stock', $l['quantity']);
                }
            }

            // ── Artículos entregados ───────────────────────────────────────
            $outLines = [];
            $deliveredTotal = 0;
            if ($deliveredInput) {
                $resolved = $this->sales->resolveItems($deliveredInput);
                $outLines = $resolved['lines'];
                $deliveredTotal = $resolved['subtotal'];
                $this->sales->assertStock($outLines);

                foreach ($outLines as $l) {
                    if ($l['variant']) {
                        $l['variant']->decrement('stock', $l['quantity']);
                    } else {
                        $l['product']->decrement('stock', $l['quantity']);
                    }
                }
            }

            // ── Diferencia y cómo se resuelve ──────────────────────────────
            $difference = $deliveredTotal - $returnedTotal;
            $method = $data['payment_method'] ?? null;
            $settlement = 'sin_diferencia';
            $movesCash = false;

            if ($difference > 0) {
                $settlement = 'cobrado';
                $movesCash = true;
            } elseif ($difference < 0) {
                if (($data['negative_settlement'] ?? 'saldo_a_favor') === 'reintegro') {
                    $settlement = 'reintegrado';
                    $movesCash = true;
                } else {
                    $settlement = 'saldo_a_favor';
                }
            }

            $register = CashRegister::current();
            if ($movesCash) {
                if (! $method) {
                    abort(422, $difference > 0
                        ? 'Elegí con qué medio de pago se cobra la diferencia.'
                        : 'Elegí con qué medio de pago se reintegra la diferencia.');
                }
                if (! $register) {
                    abort(422, 'Abrí la caja para registrar un cambio con diferencia de dinero.');
                }
            } else {
                $method = null;
            }

            $exchange = Exchange::create([
                'number' => 'TMP-'.uniqid(),
                'kind' => $kind,
                'user_id' => $userId,
                'cash_register_id' => $register?->id,
                'original_order_id' => $original?->id,
                'reason' => $data['reason'] ?? null,
                'returned_total' => $returnedTotal,
                'delivered_total' => $deliveredTotal,
                'difference' => $difference,
                'settlement' => $settlement,
                'payment_method' => $method,
                'notes' => $data['notes'] ?? null,
            ]);
            $exchange->update(['number' => 'CAM-'.str_pad((string) $exchange->id, 6, '0', STR_PAD_LEFT)]);

            foreach ($inLines as $l) {
                ExchangeItem::create([
                    'exchange_id' => $exchange->id,
                    'direction' => 'in',
                    'product_id' => $l['product']->id,
                    'product_variant_id' => $l['variant']?->id,
                    'name' => $l['product']->name,
                    'variant_label' => $l['variant']?->label,
                    'quantity' => $l['quantity'],
                    'unit_price' => $l['unit_price'],
                    'restocked' => $l['restock'],
                ]);
            }
            foreach ($outLines as $l) {
                ExchangeItem::create([
                    'exchange_id' => $exchange->id,
                    'direction' => 'out',
                    'product_id' => $l['product']->id,
                    'product_variant_id' => $l['variant']?->id,
                    'name' => $l['name'],
                    'variant_label' => $l['variant_label'],
                    'quantity' => $l['quantity'],
                    'unit_price' => $l['unit_price'],
                    'restocked' => false,
                ]);
            }

            if ($movesCash) {
                $exchange->update(['ledger_order_id' => $this->postToRegister($exchange, $method, $difference)->id]);
            }

            return $exchange->fresh(['items', 'user', 'originalOrder']);
        });
    }

    /** Asiento de caja de la diferencia (positivo: se cobró; negativo: se reintegró). */
    private function postToRegister(Exchange $exchange, string $method, int $difference): Order
    {
        $label = $difference > 0
            ? "{$exchange->number} · diferencia cobrada"
            : "{$exchange->number} · reintegro al cliente";

        $order = Order::create([
            'number' => 'TMP',
            'channel' => 'local',
            'kind' => $exchange->kind,
            'customer_id' => null,
            'user_id' => $exchange->user_id,
            'status' => 'pagado',
            'payment_method' => $method,
            'payment_status' => 'aprobado',
            'shipping_method' => null,
            'subtotal' => $exchange->delivered_total,
            'discount' => $exchange->returned_total,
            'shipping_cost' => 0,
            'total' => $difference,
            'coupon_code' => null,
            'address' => null,
            'notes' => ucfirst($exchange->kind).' '.$exchange->number,
        ]);
        $order->update(['number' => $this->sales->generateNumber($order->id)]);

        $order->items()->create([
            'product_id' => null,
            'product_variant_id' => null,
            'name' => $label,
            'variant_label' => null,
            'image' => null,
            'unit_price' => $difference,
            'quantity' => 1,
        ]);

        $order->payments()->create([
            'provider' => $method,
            'status' => 'aprobado',
            'amount' => $difference,
        ]);

        return $order;
    }

    /** Acepta "123", "PJ-123" o "PJ-000123". */
    public function findOriginalOrder(?string $number): ?Order
    {
        $number = trim((string) $number);
        if ($number === '') {
            return null;
        }
        if (preg_match('/^(?:PJ-?)?(\d+)$/i', $number, $m)) {
            $number = 'PJ-'.str_pad($m[1], 6, '0', STR_PAD_LEFT);
        }

        $order = Order::with('items')->where('number', $number)->first();
        if (! $order) {
            abort(422, "No encontramos la venta {$number}.");
        }

        return $order;
    }

    /**
     * Unidades que todavía se pueden devolver de una venta, por producto+variante:
     * lo comprado menos lo ya devuelto en cambios anteriores de la misma venta.
     *
     * @return array<string,int>
     */
    public function returnableByKey(Order $order): array
    {
        $left = [];
        foreach ($order->items as $it) {
            if (! $it->product_id) {
                continue;
            }
            $key = $it->product_id.'-'.($it->product_variant_id ?? 0);
            $left[$key] = ($left[$key] ?? 0) + (int) $it->quantity;
        }

        $already = ExchangeItem::query()
            ->where('direction', 'in')
            ->whereHas('exchange', fn ($q) => $q->where('original_order_id', $order->id))
            ->get();
        foreach ($already as $it) {
            $key = $it->product_id.'-'.($it->product_variant_id ?? 0);
            if (isset($left[$key])) {
                $left[$key] = max(0, $left[$key] - $it->quantity);
            }
        }

        return $left;
    }

    /** @return array{0: Product, 1: ?ProductVariant} */
    private function resolve(int $productId, mixed $variantId): array
    {
        $product = Product::with('variants')->findOrFail($productId);
        $variant = null;
        if ($variantId) {
            $variant = $product->variants->firstWhere('id', (int) $variantId);
            if (! $variant) {
                abort(422, "La variante elegida no pertenece a {$product->name}.");
            }
        } elseif ($product->variants->isNotEmpty()) {
            abort(422, "Elegí la variante (talle, material…) de {$product->name}.");
        }

        return [$product, $variant];
    }
}

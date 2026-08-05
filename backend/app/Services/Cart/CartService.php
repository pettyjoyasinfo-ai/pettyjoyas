<?php

namespace App\Services\Cart;

use App\Models\Cart;
use App\Models\Product;
use App\Models\User;
use App\Services\Discounts\DiscountService;
use App\Services\Inventory\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Lógica del carrito. Persiste un carrito por usuario (o por invitado, vía
 * guest_token) y, sobre todo, VALIDA cada línea contra el estado vivo del
 * catálogo: disponibilidad, stock (por producto o por variante), y cambios
 * de precio. El frontend pinta los avisos según el `status` de cada línea.
 *
 * Cada ítem guarda `reserved_until` = ahora + 20 min (logueado) o + 10 min
 * (invitado). El InventoryService descuenta esas unidades del stock visible
 * para los demás mientras la reserva esté activa.
 */
class CartService
{
    public function __construct(
        private InventoryService $inventory,
        private DiscountService $discounts,
    ) {}

    /** Carrito del usuario (lo crea si no existe). */
    public function forUser(User $user): Cart
    {
        return Cart::firstOrCreate(['user_id' => $user->id]);
    }

    /** Carrito de un invitado identificado por un token persistido en el navegador (lo crea si no existe). */
    public function forGuest(string $token): Cart
    {
        return Cart::firstOrCreate(['guest_token' => $token]);
    }

    /**
     * Resuelve el carrito de la request actual: el del usuario autenticado
     * (Sanctum) o, si no hay sesión, el del token de invitado enviado en el
     * header `X-Guest-Cart-Token`. Punto único de resolución para el controller.
     */
    public function resolve(Request $request): Cart
    {
        if ($user = $request->user('sanctum')) {
            return $this->forUser($user);
        }

        $token = $request->header('X-Guest-Cart-Token');
        abort_if(! $token, 422, 'Falta el token de carrito de invitado.');

        return $this->forGuest($token);
    }

    /** Minutos de reserva de stock según el tipo de carrito. */
    private function reservationMinutesFor(Cart $cart): int
    {
        return $cart->user_id
            ? InventoryService::RESERVATION_MINUTES_USER
            : InventoryService::RESERVATION_MINUTES_GUEST;
    }

    /**
     * Agrega (o suma) un ítem al carrito, respetando el stock.
     * Guarda el precio unitario vigente como referencia para detectar cambios.
     * Renueva la reserva de stock.
     */
    public function add(Cart $cart, int $productId, ?int $variantId, int $qty): void
    {
        $product = Product::with('variants')->findOrFail($productId);
        $unit = $this->currentUnitPrice($product, $variantId);
        // Stock disponible excluyendo la propia reserva del carrito.
        $available = $this->inventory->currentStock($productId, $variantId, $cart->id);

        $item = $cart->items()->firstOrNew([
            'product_id' => $productId,
            'product_variant_id' => $variantId,
        ]);

        $target = ($item->quantity ?? 0) + max(1, $qty);
        $item->quantity = max(1, min($target, $available > 0 ? $available : $target));
        $item->unit_price = $unit;
        $item->reserved_until = now()->addMinutes($this->reservationMinutesFor($cart));
        $item->save();
    }

    /** Fija la cantidad de una línea (la elimina si es 0). Renueva la reserva. */
    public function setQuantity(Cart $cart, int $itemId, int $qty): void
    {
        $item = $cart->items()->findOrFail($itemId);
        if ($qty <= 0) {
            $item->delete();

            return;
        }
        $available = $this->inventory->currentStock($item->product_id, $item->product_variant_id, $cart->id);
        $item->quantity = $available > 0 ? min($qty, $available) : $qty;
        $item->reserved_until = now()->addMinutes($this->reservationMinutesFor($cart));
        $item->save();
    }

    public function remove(Cart $cart, int $itemId): void
    {
        $cart->items()->where('id', $itemId)->delete();
    }

    public function clear(Cart $cart): void
    {
        $cart->items()->delete();
    }

    /**
     * Fusiona ítems "de invitado" (los que el usuario tenía en el navegador antes
     * de loguearse) dentro del carrito del usuario, sumando cantidades.
     *
     * @param  array<int,array{product_id:int,product_variant_id:?int,quantity:int}>  $guestItems
     */
    public function merge(Cart $cart, array $guestItems): void
    {
        DB::transaction(function () use ($cart, $guestItems) {
            foreach ($guestItems as $g) {
                if (empty($g['product_id'])) {
                    continue;
                }
                $this->add(
                    $cart,
                    (int) $g['product_id'],
                    isset($g['product_variant_id']) ? (int) $g['product_variant_id'] : null,
                    (int) ($g['quantity'] ?? 1),
                );
            }
        });
    }

    /**
     * Devuelve el carrito (de usuario o invitado) validado contra el catálogo vivo.
     */
    public function snapshotFor(Cart $cart, ?string $promo = null): array
    {
        $cart->load(['items.product.category', 'items.product.variants', 'items.product.images', 'items.variant']);

        $lines = [];
        foreach ($cart->items as $item) {
            $line = $this->validateLine(
                $item->product,
                $item->product_variant_id,
                $item->quantity,
                $item->unit_price,
                $item->id,
                $promo,
                null,
                $cart->id,
            );
            $line['reservedUntil'] = $item->reserved_until?->toIso8601String();
            $lines[] = $line;
        }

        return $this->wrap($lines);
    }

    /**
     * Valida una lista arbitraria de ítems SIN persistir (para invitados o para
     * revalidar en el checkout). Cada ítem: {product_id, product_variant_id?,
     * quantity, price?} — `price` es el precio que el cliente tenía guardado.
     *
     * @param  array<int,array>  $items
     */
    public function validateItems(array $items, ?string $promo = null): array
    {
        $ids = collect($items)->pluck('product_id')->filter()->unique()->all();
        $products = Product::with(['category', 'variants', 'images'])->findMany($ids)->keyBy('id');

        $lines = [];
        foreach ($items as $it) {
            $product = $products->get((int) ($it['product_id'] ?? 0));
            $lines[] = $this->validateLine(
                $product,
                isset($it['product_variant_id']) ? (int) $it['product_variant_id'] : null,
                (int) ($it['quantity'] ?? 1),
                isset($it['price']) ? (int) $it['price'] : null,
                null,
                $promo,
                $it,
            );
        }

        return $this->wrap($lines);
    }

    /**
     * Construye una línea validada. `$product` puede ser null (producto borrado).
     * $excludeCartId permite calcular el stock disponible excluyendo la reserva propia.
     */
    private function validateLine(
        ?Product $product,
        ?int $variantId,
        int $quantity,
        ?int $referencePrice,
        ?int $itemId,
        ?string $promo,
        ?array $fallback = null,
        ?int $excludeCartId = null,
    ): array {
        // Producto inexistente o inactivo → no disponible.
        if (! $product || ! $product->active) {
            return [
                'id' => $itemId,
                'productId' => (string) ($product->id ?? ($fallback['product_id'] ?? '')),
                'variantId' => $variantId ? (string) $variantId : null,
                'slug' => $product->slug ?? null,
                'name' => $product->name ?? ($fallback['name'] ?? 'Producto no disponible'),
                'image' => $product?->images->first()->url ?? ($fallback['image'] ?? null),
                'variantLabel' => $fallback['variantLabel'] ?? null,
                'quantity' => 0,
                'requestedQuantity' => $quantity,
                'price' => 0,
                'previousPrice' => $referencePrice,
                'lineTotal' => 0,
                'availableStock' => 0,
                'maxStock' => 0,
                'status' => 'unavailable',
                'reservedUntil' => null,
            ];
        }

        $variant = $variantId ? $product->variants->firstWhere('id', $variantId) : null;

        // Se pidió una variante que ya no existe.
        if ($variantId && ! $variant) {
            return [
                'id' => $itemId,
                'productId' => (string) $product->id,
                'variantId' => (string) $variantId,
                'slug' => $product->slug,
                'name' => $product->name,
                'image' => $product->images->first()->url ?? null,
                'variantLabel' => $fallback['variantLabel'] ?? null,
                'quantity' => 0,
                'requestedQuantity' => $quantity,
                'price' => 0,
                'previousPrice' => $referencePrice,
                'lineTotal' => 0,
                'availableStock' => 0,
                'maxStock' => 0,
                'status' => 'unavailable',
                'reservedUntil' => null,
            ];
        }

        $available = $this->inventory->currentStock($product->id, $variantId, $excludeCartId);
        $unit = $this->currentUnitPrice($product, $variantId, $promo);

        // Determina el estado por prioridad: sin stock > ajustado > precio cambiado > ok.
        $status = 'ok';
        $qty = $quantity;
        if ($available <= 0) {
            $status = 'out_of_stock';
            $qty = 0;
        } elseif ($quantity > $available) {
            $status = 'adjusted';
            $qty = $available;
        } elseif ($referencePrice !== null && $referencePrice !== $unit) {
            $status = 'price_changed';
        }

        return [
            'id' => $itemId,
            'productId' => (string) $product->id,
            'variantId' => $variant ? (string) $variant->id : null,
            'slug' => $product->slug,
            'name' => $product->name,
            'image' => $product->images->first()->url ?? null,
            'variantLabel' => $variant?->label,
            'quantity' => $qty,
            'requestedQuantity' => $quantity,
            'price' => $unit,
            'previousPrice' => $referencePrice !== null && $referencePrice !== $unit ? $referencePrice : null,
            'lineTotal' => $unit * $qty,
            'availableStock' => $available,
            'maxStock' => $available,
            'status' => $status,
            'reservedUntil' => null, // se sobreescribe en snapshotFor con el valor real
        ];
    }

    /** Precio unitario vigente = (precio base con promo) + delta de variante. */
    private function currentUnitPrice(Product $product, ?int $variantId, ?string $promo = null): int
    {
        $this->discounts->decorate([$product], $promo);
        $base = (int) ($product->discounted_price ?? $product->price);

        $delta = 0;
        if ($variantId) {
            $variant = $product->variants->firstWhere('id', $variantId);
            $delta = (int) ($variant->price_delta ?? 0);
        }

        return max(0, $base + $delta);
    }

    /** Envuelve las líneas con totales y la lista de avisos. */
    private function wrap(array $lines): array
    {
        $subtotal = collect($lines)->sum('lineTotal');
        $issues = collect($lines)
            ->pluck('status')
            ->filter(fn ($s) => $s !== 'ok')
            ->unique()
            ->values()
            ->all();

        $hasBlockingIssues = collect($lines)->contains(fn ($l) => in_array($l['status'], ['out_of_stock', 'unavailable'], true));

        return [
            'items' => $lines,
            'subtotal' => $subtotal,
            'issues' => $issues,
            'hasBlockingIssues' => $hasBlockingIssues,
        ];
    }
}

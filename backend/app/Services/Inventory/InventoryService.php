<?php

namespace App\Services\Inventory;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

/**
 * Stock derivado del campo `stock` en products/product_variants,
 * descontando las unidades reservadas en carritos activos.
 * La disponibilidad visible = stock − unidades reservadas en carritos activos.
 * Cada línea de carrito bloquea sus unidades por RESERVATION_MINUTES_USER (logueado)
 * o RESERVATION_MINUTES_GUEST (invitado) minutos, según el carrito (reserved_until).
 */
class InventoryService
{
    const RESERVATION_MINUTES_USER = 20;

    const RESERVATION_MINUTES_GUEST = 10;

    /**
     * Unidades actualmente bloqueadas en carritos ajenos, para un producto/variante.
     * Si se pasa $excludeCartId, se excluye ese carrito (el propio, logueado o invitado).
     */
    private function reservedInCarts(int $productId, ?int $variantId = null, ?int $excludeCartId = null): int
    {
        return (int) CartItem::query()
            ->where('cart_items.product_id', $productId)
            ->when($variantId, fn ($q) => $q->where('cart_items.product_variant_id', $variantId))
            ->when($excludeCartId, fn ($q) => $q->where('cart_items.cart_id', '!=', $excludeCartId))
            ->where('cart_items.reserved_until', '>', now())
            ->sum('cart_items.quantity');
    }

    /** Stock disponible de un producto (o variante puntual), restando reservas activas. */
    public function currentStock(int $productId, ?int $variantId = null, ?int $excludeCartId = null): int
    {
        if ($variantId) {
            $raw = (int) ProductVariant::where('id', $variantId)->value('stock');
        } else {
            $raw = (int) Product::where('id', $productId)->value('stock');
        }

        return max(0, $raw - $this->reservedInCarts($productId, $variantId, $excludeCartId));
    }

    /**
     * Stock por variante de un producto: [variant_id => stock disponible].
     * Resta reservas activas por variante.
     */
    public function stockByVariant(int $productId, ?int $excludeCartId = null): array
    {
        $variants = ProductVariant::where('product_id', $productId)->get(['id', 'stock']);

        $reserved = CartItem::query()
            ->where('cart_items.product_id', $productId)
            ->whereNotNull('cart_items.product_variant_id')
            ->when($excludeCartId, fn ($q) => $q->where('cart_items.cart_id', '!=', $excludeCartId))
            ->where('cart_items.reserved_until', '>', now())
            ->groupBy('cart_items.product_variant_id')
            ->select('cart_items.product_variant_id', DB::raw('SUM(cart_items.quantity) as qty'))
            ->pluck('qty', 'product_variant_id')
            ->map(fn ($v) => (int) $v)
            ->toArray();

        $result = [];
        foreach ($variants as $variant) {
            $result[$variant->id] = max(0, (int) $variant->stock - ($reserved[$variant->id] ?? 0));
        }

        return $result;
    }

    /** Mapa de stock por producto para una lista de ids (evita N+1). Sin reservas. */
    public function stockForProducts(array $productIds): array
    {
        return Product::whereIn('id', $productIds)
            ->pluck('stock', 'id')
            ->map(fn ($v) => (int) $v)
            ->toArray();
    }

    /** Verifica disponibilidad antes de vender. */
    public function isAvailable(int $productId, int $quantity, ?int $variantId = null, ?int $excludeCartId = null): bool
    {
        return $this->currentStock($productId, $variantId, $excludeCartId) >= $quantity;
    }
}

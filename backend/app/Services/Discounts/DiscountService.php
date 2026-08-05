<?php

namespace App\Services\Discounts;

use App\Models\Discount;
use App\Models\Product;
use Illuminate\Support\Collection;

/**
 * Aplica promociones automáticas a los productos: elige el mejor descuento
 * vigente que aplique (por catálogo, categoría o producto), respetando el período.
 * Los descuentos "por link" sólo se consideran si llega el token (?promo=).
 */
class DiscountService
{
    private ?Collection $cache = null;

    public function live(?string $promo = null): Collection
    {
        $all = $this->cache ??= Discount::all()->filter->isLive();

        return $all->filter(fn (Discount $d) => ! $d->requires_token || ($promo && $d->token === $promo))->values();
    }

    /** Aplica el mejor descuento a cada producto (set discounted_price + discount_pct). */
    public function decorate(Collection|array $products, ?string $promo = null): void
    {
        $discounts = $this->live($promo);
        if ($discounts->isEmpty()) {
            return;
        }

        foreach ($products as $product) {
            $best = null;
            $bestPrice = $product->price;
            foreach ($discounts as $d) {
                if (! $d->appliesTo($product)) {
                    continue;
                }
                $price = $d->apply($product->price);
                if ($price < $bestPrice) {
                    $bestPrice = $price;
                    $best = $d;
                }
            }
            if ($best) {
                $product->discounted_price = $bestPrice;
                $product->discount_name = $best->name;
            }
        }
    }
}

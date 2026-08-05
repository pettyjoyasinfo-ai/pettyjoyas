<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Forma del JSON alineada con el tipo `Product` de
 * `frontend/src/lib/types.ts` (claves camelCase). Así el seam de la API encaja
 * sin tocar la UI: basta apuntar NEXT_PUBLIC_API_URL al backend.
 */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'barcode' => $this->barcode,
            // Datos manuales del módulo de Etiquetas (referencia + peso/multiplicador),
            // se cargan una sola vez y quedan guardados — ver ProductController::updateLabelInfo.
            'labelRef' => $this->label_ref,
            'labelWeight' => $this->label_weight,
            'categorySlug' => $this->category?->slug,
            'categoryName' => $this->category?->name,
            'collection' => $this->collection,
            // Si hay una promo activa (DiscountService), el precio efectivo baja y
            // el precio base queda como "precio tachado".
            'price' => $this->effectivePrice(),
            'compareAtPrice' => $this->effectiveCompareAt(),
            'discountName' => $this->onDiscount() ? ($this->discount_name ?? null) : null,
            'images' => $this->images->pluck('url')->all(),
            'shortDescription' => $this->short_description,
            'description' => $this->description,
            'specs' => $this->specs ?? (object) [],
            'variants' => ProductVariantResource::collection($this->variants),
            'stock' => (int) ($this->stock_total ?? 0),
            'rating' => (float) $this->rating,
            'reviewsCount' => (int) $this->reviews_count,
            'badges' => $this->computeBadges(),
            'whatsappUrl' => $this->whatsapp_url,
            'createdAt' => $this->created_at?->toDateString(),
        ];
    }

    /**
     * "nuevo" y "agotado" se calculan automáticamente; "oferta" se deriva de los
     * precios efectivos. "destacado" se mantiene como marca editorial manual.
     */
    private function computeBadges(): array
    {
        // Solo conservamos la marca manual "destacado"
        $stored = array_values(array_filter(
            $this->badges ?? [],
            fn (string $b) => $b === 'destacado',
        ));

        // "nuevo" — 7 días desde la creación
        if ($this->created_at?->gte(now()->subDays(7))) {
            $stored[] = 'nuevo';
        }

        // "oferta" — precio efectivo menor al precio base o tiene precio tachado
        $effectivePrice   = $this->effectivePrice();
        $effectiveCompare = $this->effectiveCompareAt();
        if ($effectiveCompare !== null && $effectiveCompare > $effectivePrice) {
            $stored[] = 'oferta';
        }

        // "agotado" — sin stock disponible
        if (($this->stock_total ?? 0) <= 0) {
            $stored[] = 'agotado';
        }

        return $stored;
    }

    private function onDiscount(): bool
    {
        return isset($this->discounted_price) && $this->discounted_price < (int) $this->price;
    }

    private function effectivePrice(): int
    {
        return $this->onDiscount() ? (int) $this->discounted_price : (int) $this->price;
    }

    private function effectiveCompareAt(): ?int
    {
        if ($this->onDiscount()) {
            return (int) $this->price;
        }

        return null;
    }
}


<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'productId' => (string) $this->product_id,
            'productName' => $this->whenLoaded('product', fn () => $this->product?->name),
            'variantLabel' => $this->whenLoaded('variant', fn () => $this->variant?->label),
            'variantId' => $this->product_variant_id ? (string) $this->product_variant_id : null,
            'type' => $this->type->value,
            'quantity' => (int) $this->quantity,
            'note' => $this->note,
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}

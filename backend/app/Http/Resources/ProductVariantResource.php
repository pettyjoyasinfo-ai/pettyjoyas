<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'label' => $this->label,
            'type' => $this->type,
            'value' => $this->value,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'labelRef' => $this->label_ref,
            'labelWeight' => $this->label_weight,
            // El stock se inyecta desde el controller (derivado de movimientos).
            'stock' => (int) ($this->stock ?? 0),
            'priceDelta' => (int) $this->price_delta,
            'weight' => $this->weight !== null ? (float) $this->weight : null,
            'imageUrl' => $this->image_url,
        ];
    }
}

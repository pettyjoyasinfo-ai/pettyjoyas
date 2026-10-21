<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExchangeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $item = fn ($it) => [
            'productId' => $it->product_id,
            'variantId' => $it->product_variant_id,
            'name' => $it->name,
            'variantLabel' => $it->variant_label,
            'quantity' => (int) $it->quantity,
            'unitPrice' => (int) $it->unit_price,
            'restocked' => (bool) $it->restocked,
        ];

        return [
            'id' => $this->id,
            'number' => $this->number,
            'kind' => $this->kind,
            'createdAt' => $this->created_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn () => $this->user?->name),
            'originalOrderNumber' => $this->whenLoaded('originalOrder', fn () => $this->originalOrder?->number),
            'reason' => $this->reason,
            'notes' => $this->notes,
            'returnedTotal' => (int) $this->returned_total,
            'deliveredTotal' => (int) $this->delivered_total,
            // Positivo: el cliente pagó la diferencia. Negativo: a favor del cliente.
            'difference' => (int) $this->difference,
            // sin_diferencia | cobrado | reintegrado | saldo_a_favor
            'settlement' => $this->settlement,
            'paymentMethod' => $this->payment_method,
            'returned' => $this->whenLoaded('items', fn () => $this->items->where('direction', 'in')->values()->map($item)),
            'delivered' => $this->whenLoaded('items', fn () => $this->items->where('direction', 'out')->values()->map($item)),
        ];
    }
}

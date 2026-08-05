<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'number' => $this->number,
            'channel' => $this->channel?->value,
            'status' => $this->status?->value,
            'paymentMethod' => $this->payment_method,
            'paymentStatus' => $this->payment_status,
            'shippingMethod' => $this->shipping_method,
            'subtotal' => (int) $this->subtotal,
            'discount' => (int) $this->discount,
            'shippingCost' => (int) $this->shipping_cost,
            'total' => (int) $this->total,
            'couponCode' => $this->coupon_code,
            'address' => $this->address,
            'notes' => $this->notes,
            'customer' => $this->whenLoaded('customer', fn () => $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'email' => $this->customer->email,
            ] : null),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($it) => [
                'productId' => $it->product_id,
                'name' => $it->name,
                'variantLabel' => $it->variant_label,
                'unitPrice' => (int) $it->unit_price,
                'quantity' => (int) $it->quantity,
            ])),
            'createdAt' => $this->created_at?->toIso8601String(),
        ];
    }
}

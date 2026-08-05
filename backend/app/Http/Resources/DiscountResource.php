<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiscountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'type' => $this->type?->value,
            'value' => (int) $this->value,
            'scope' => $this->scope,
            'categoryId' => $this->category_id ? (string) $this->category_id : null,
            'categoryName' => $this->whenLoaded('category', fn () => $this->category?->name),
            'categorySlug' => $this->whenLoaded('category', fn () => $this->category?->slug),
            'productIds' => $this->product_ids ?? [],
            'startsAt' => $this->starts_at?->toDateString(),
            'endsAt' => $this->ends_at?->toDateString(),
            'active' => (bool) $this->active,
            'requiresToken' => (bool) $this->requires_token,
            'token' => $this->token,
            'link' => $this->token ? config('app.frontend_url')."/promo/{$this->token}" : null,
            'live' => $this->isLive(),
        ];
    }
}

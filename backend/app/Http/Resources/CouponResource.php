<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'code' => $this->code,
            'type' => $this->type?->value,
            'value' => (int) $this->value,
            'minSubtotal' => $this->min_subtotal ? (int) $this->min_subtotal : null,
            'maxUses' => $this->max_uses,
            'usedCount' => (int) $this->used_count,
            'expiresAt' => $this->expires_at?->toDateString(),
            'active'    => (bool) $this->active,
            'isPublic'  => (bool) $this->is_public,
            'description' => $this->description,
        ];
    }
}

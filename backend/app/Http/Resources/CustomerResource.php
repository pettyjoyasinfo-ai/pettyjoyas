<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'birthday' => $this->birthday?->format('d/m'),
            'segment' => $this->segment?->value,
            'vip' => (bool) $this->vip,
            'tags' => $this->tags ?? [],
            'notes' => $this->notes,
            // Métricas (inyectadas por el controller para evitar N+1).
            'orders' => (int) ($this->orders_count ?? 0),
            'spent' => (int) ($this->orders_sum_total ?? 0),
            'purchases' => OrderResource::collection($this->whenLoaded('orders')),
            // Estado de suscripción al newsletter (cargado con loadNewsletterSubscriber).
            'newsletterSubscribed' => $this->whenLoaded(
                'newsletterSubscriber',
                fn () => $this->newsletterSubscriber?->active ?? false,
                false,
            ),
            'newsletterSubscriberId' => $this->whenLoaded(
                'newsletterSubscriber',
                fn () => $this->newsletterSubscriber?->id,
            ),
            'userId' => $this->user_id,
            'createdAt' => $this->created_at?->toDateString(),
        ];
    }
}

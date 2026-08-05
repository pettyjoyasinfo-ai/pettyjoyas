<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'        => $this->id,
            'author'    => $this->author ?? $this->user?->name ?? 'Cliente',
            'rating'    => $this->rating,
            'body'      => $this->body,
            'createdAt' => $this->created_at->toDateString(),
        ];
    }
}

<?php

namespace App\Models;

use App\Enums\CouponType;
use App\Models\Product;
use Illuminate\Database\Eloquent\Model;

class Discount extends Model
{
    protected $fillable = [
        'name', 'type', 'value', 'scope', 'category_id', 'product_ids',
        'starts_at', 'ends_at', 'active', 'requires_token', 'token',
    ];

    protected $casts = [
        'type' => CouponType::class,
        'product_ids' => 'array',
        'active' => 'boolean',
        'requires_token' => 'boolean',
        'starts_at' => 'date',
        'ends_at' => 'date',
    ];

    public function category(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function isLive(): bool
    {
        if (! $this->active) {
            return false;
        }
        if ($this->starts_at && $this->starts_at->isFuture()) {
            return false;
        }
        if ($this->ends_at && $this->ends_at->endOfDay()->isPast()) {
            return false;
        }

        return true;
    }

    /** ¿Aplica a este producto? */
    public function appliesTo(Product $product): bool
    {
        return match ($this->scope) {
            'category' => $product->category_id === $this->category_id,
            'products' => in_array($product->id, $this->product_ids ?? [], true),
            default => true, // all
        };
    }

    /** Precio con este descuento aplicado sobre un precio base. */
    public function apply(int $base): int
    {
        $off = $this->type === CouponType::Percent
            ? (int) round($base * $this->value / 100)
            : min($this->value, $base);

        return max(0, $base - $off);
    }
}

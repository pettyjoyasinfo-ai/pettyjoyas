<?php

namespace App\Models;

use App\Enums\CouponType;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code', 'type', 'value', 'min_subtotal', 'max_uses', 'used_count',
        'starts_at', 'expires_at', 'active', 'is_public', 'description',
    ];

    protected $casts = [
        'type'      => CouponType::class,
        'active'    => 'boolean',
        'is_public' => 'boolean',
        'starts_at' => 'date',
        'expires_at' => 'date',
    ];

    /** Descuento que aplica este cupón sobre un subtotal (ARS). */
    public function discountFor(int $subtotal): int
    {
        if ($this->min_subtotal && $subtotal < $this->min_subtotal) {
            return 0;
        }

        return $this->type === CouponType::Percent
            ? (int) round($subtotal * $this->value / 100)
            : min($this->value, $subtotal);
    }

    public function isUsable(): bool
    {
        if (! $this->active) {
            return false;
        }
        if ($this->max_uses && $this->used_count >= $this->max_uses) {
            return false;
        }
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }
}

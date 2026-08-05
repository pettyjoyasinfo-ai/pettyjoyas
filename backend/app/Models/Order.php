<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\SaleChannel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'number', 'channel', 'customer_id', 'user_id', 'status',
        'payment_method', 'payment_status', 'shipping_method',
        'subtotal', 'discount', 'shipping_cost', 'total', 'coupon_code',
        'address', 'notes',
    ];

    protected $casts = [
        'address' => 'array',
        'status' => OrderStatus::class,
        'channel' => SaleChannel::class,
        'subtotal' => 'integer',
        'discount' => 'integer',
        'shipping_cost' => 'integer',
        'total' => 'integer',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}

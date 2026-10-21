<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExchangeItem extends Model
{
    protected $fillable = [
        'exchange_id', 'direction', 'product_id', 'product_variant_id',
        'name', 'variant_label', 'quantity', 'unit_price', 'restocked',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'integer',
        'restocked' => 'boolean',
    ];

    public function exchange(): BelongsTo
    {
        return $this->belongsTo(Exchange::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

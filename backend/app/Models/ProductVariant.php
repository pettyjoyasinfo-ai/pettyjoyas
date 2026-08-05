<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id', 'label', 'type', 'value', 'sku', 'barcode', 'label_ref', 'label_weight',
        'price_delta', 'weight', 'image_url', 'stock',
    ];

    protected $casts = [
        'price_delta' => 'integer',
        'weight' => 'float',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

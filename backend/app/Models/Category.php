<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'slug', 'name', 'description', 'image', 'parent_id', 'featured', 'position',
    ];

    protected $casts = [
        'featured' => 'boolean',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    /** Categoría cuyos productos (y los de sus subcategorías) solo admiten pago en efectivo o transferencia. */
    public const RESTRICTED_PAYMENT_CATEGORY_SLUG = 'oro';

    /**
     * Ids de la categoría $slug y todas sus descendientes, en cualquier nivel
     * (no solo el nivel inmediato). Vacío si la categoría no existe.
     */
    public static function idsIncludingDescendants(string $slug): array
    {
        $root = self::where('slug', $slug)->first(['id']);
        if (! $root) {
            return [];
        }

        $parentById = self::query()->pluck('parent_id', 'id');
        $ids = [$root->id];

        $added = true;
        while ($added) {
            $added = false;
            foreach ($parentById as $id => $parentId) {
                if ($parentId !== null && in_array($parentId, $ids, true) && ! in_array($id, $ids, true)) {
                    $ids[] = $id;
                    $added = true;
                }
            }
        }

        return $ids;
    }

    /** Ids de la categoría "Oro" y todas sus subcategorías. */
    public static function restrictedPaymentCategoryIds(): array
    {
        return self::idsIncludingDescendants(self::RESTRICTED_PAYMENT_CATEGORY_SLUG);
    }
}

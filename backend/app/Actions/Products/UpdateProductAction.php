<?php

namespace App\Actions\Products;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UpdateProductAction
{
    /**
     * @param  array  $data  Datos validados (UpdateProductRequest). Solo campos del producto;
     *                       variantes/stock se gestionan en sus propios endpoints/acciones.
     */
    public function execute(Product $product, array $data): Product
    {
        return DB::transaction(function () use ($product, $data) {
            $product->update(array_filter([
                'name' => $data['name'] ?? null,
                'category_id' => $data['category_id'] ?? null,
                'collection' => $data['collection'] ?? null,
                'price' => $data['price'] ?? null,
                'short_description' => $data['short_description'] ?? null,
                'description' => $data['description'] ?? null,
                'specs' => $data['specs'] ?? null,
                'badges' => $data['badges'] ?? null,
                'active' => $data['active'] ?? null,
                'whatsapp_url' => $data['whatsapp_url'] ?? null,
            ], fn ($v) => $v !== null));

            if (array_key_exists('images', $data)) {
                $product->images()->delete();
                foreach ($data['images'] ?? [] as $pos => $url) {
                    $product->images()->create(['url' => $url, 'position' => $pos]);
                }
            }

            if (array_key_exists('variants', $data)) {
                $submittedIds = collect($data['variants'] ?? [])->pluck('id')->filter()->values()->all();
                $product->variants()->whereNotIn('id', $submittedIds)->delete();

                foreach ($data['variants'] ?? [] as $i => $v) {
                    if (!empty($v['id'])) {
                        $product->variants()->where('id', $v['id'])->update([
                            'label' => $v['label'],
                            'type' => $v['type'] ?? 'variante',
                            'group' => $v['group'] ?? null,
                            'value' => $v['value'] ?? $v['label'],
                            'price_delta' => $v['price_delta'] ?? 0,
                            'weight' => $v['weight'] ?? null,
                            'stock' => (int) ($v['stock'] ?? 0),
                            'image_url' => $v['image_url'] ?? null,
                        ]);
                    } else {
                        // sku/barcode son NOT NULL/unique en la BD: se generan a partir
                        // del id de la variante recién creada (igual que al crear un
                        // producto nuevo), no hay forma de saberlos antes del insert.
                        $variant = $product->variants()->create([
                            'label' => $v['label'],
                            'type' => $v['type'] ?? 'variante',
                            'group' => $v['group'] ?? null,
                            'value' => $v['value'] ?? $v['label'],
                            'sku' => $v['sku'] ?? 'TMP-'.Str::random(10),
                            'price_delta' => $v['price_delta'] ?? 0,
                            'weight' => $v['weight'] ?? null,
                            'stock' => (int) ($v['stock'] ?? 0),
                            'image_url' => $v['image_url'] ?? null,
                        ]);
                        $variant->update([
                            'sku' => $v['sku'] ?? Str::upper(Str::slug($product->name)).'-'.$variant->id,
                            'barcode' => CreateProductAction::variantBarcode($variant->id),
                        ]);
                    }
                }
            }

            // Stock directo del producto (solo aplica sin variantes). Antes esto
            // vivía adentro del `if (array_key_exists('variants', ...))` de
            // arriba, así que si el form no mandaba esa clave (producto sin
            // variantes, como en la edición), el stock ingresado nunca se
            // guardaba. Ahora es independiente: se actualiza si vino `stock`
            // en el payload y el producto (tras esta edición) no tiene variantes.
            $hasVariants = $product->fresh()->variants()->exists();
            if (! $hasVariants && array_key_exists('stock', $data)) {
                $product->update(['stock' => (int) $data['stock']]);
            }

            return $product->fresh(['category', 'variants', 'images']);
        });
    }
}

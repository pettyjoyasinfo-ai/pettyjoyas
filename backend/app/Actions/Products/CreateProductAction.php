<?php

namespace App\Actions\Products;

use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateProductAction
{
    /**
     * @param  array  $data  Datos validados (StoreProductRequest).
     */
    public function execute(array $data, ?int $userId = null): Product
    {
        return DB::transaction(function () use ($data) {
            $waNumber = env('PETTY_WA_NUMBER', '5491100000000');
            $waUrl = 'https://wa.me/'.$waNumber.'?text='.urlencode('Hola! Me interesa el producto: '.$data['name']);

            $product = Product::create([
                'slug' => self::uniqueSlug($data['slug'] ?? Str::slug($data['name'])),
                'name' => $data['name'],
                'category_id' => $data['category_id'],
                'collection' => $data['collection'] ?? null,
                'price' => $data['price'],
                'short_description' => $data['short_description'] ?? null,
                'description' => $data['description'] ?? null,
                'specs' => $data['specs'] ?? null,
                'badges' => $data['badges'] ?? [],
                'whatsapp_url' => $data['whatsapp_url'] ?? $waUrl,
                'active' => $data['active'] ?? true,
                'hidden' => $data['hidden'] ?? false,
                'stock' => empty($data['variants']) ? (int) ($data['stock'] ?? 0) : 0,
            ]);

            // Código de barras interno corto (6 dígitos) para etiquetas legibles:
            // cuanto más corto el número, menos barras y mejor lectura con pistola.
            $product->update(['barcode' => self::productBarcode($product->id)]);

            foreach ($data['variants'] ?? [] as $i => $v) {
                $variant = $product->variants()->create([
                    'label' => $v['label'],
                    'type' => $v['type'] ?? 'variante',
                    'group' => $v['group'] ?? null,
                    'value' => $v['value'] ?? $v['label'],
                    // El nombre puede repetirse entre productos, así que el SKU no puede salir
                    // solo de nombre+orden (chocaba con el índice único): se arma con el id de
                    // la variante, que se conoce recién después del insert.
                    'sku' => $v['sku'] ?? 'TMP-'.Str::random(10),
                    'price_delta' => $v['price_delta'] ?? 0,
                    'weight' => $v['weight'] ?? null,
                    'image_url' => $v['image_url'] ?? null,
                    'stock' => (int) ($v['stock'] ?? 0),
                ]);
                $variant->update([
                    'sku' => $v['sku'] ?? Str::upper(Str::slug($product->name)).'-'.$variant->id,
                    'barcode' => self::variantBarcode($variant->id),
                ]);
            }

            foreach ($data['images'] ?? [] as $pos => $url) {
                $product->images()->create(['url' => $url, 'position' => $pos]);
            }

            return $product->load(['category', 'variants', 'images']);
        });
    }

    /** Desambigua el slug agregando -2, -3... si ya existe (nombres de producto repetidos son válidos). */
    private static function uniqueSlug(string $base): string
    {
        $slug = $base;
        $i = 2;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }

    /** Código de un producto sin variantes: id a 6 dígitos (rango 000001–499999). */
    public static function productBarcode(int $productId): string
    {
        return str_pad((string) $productId, 6, '0', STR_PAD_LEFT);
    }

    /** Código de una variante: id + 500000, a 6 dígitos (rango 500000–999999), sin chocar con productos. */
    public static function variantBarcode(int $variantId): string
    {
        return str_pad((string) (500000 + $variantId), 6, '0', STR_PAD_LEFT);
    }
}

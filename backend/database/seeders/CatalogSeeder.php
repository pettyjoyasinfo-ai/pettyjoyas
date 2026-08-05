<?php

namespace Database\Seeders;

use App\Enums\StockMovementType;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['slug' => 'anillos', 'name' => 'Anillos', 'image' => '/assets/img/category/4/category-1.jpg', 'featured' => true],
            ['slug' => 'collares', 'name' => 'Collares', 'image' => '/assets/img/category/4/category-2.jpg', 'featured' => true],
            ['slug' => 'aros', 'name' => 'Aros', 'image' => '/assets/img/category/4/category-3.jpg', 'featured' => true],
            ['slug' => 'pulseras', 'name' => 'Pulseras', 'image' => '/assets/img/category/4/category-4.jpg', 'featured' => true],
            ['slug' => 'conjuntos', 'name' => 'Conjuntos', 'image' => '/assets/img/category/4/category-5.jpg', 'featured' => true],
            ['slug' => 'relojes', 'name' => 'Relojes', 'image' => '/assets/img/category/4/category-1.jpg', 'featured' => false],
        ];

        $catIds = [];
        foreach ($categories as $i => $c) {
            $cat = Category::updateOrCreate(['slug' => $c['slug']], [...$c, 'position' => $i]);
            $catIds[$c['slug']] = $cat->id;
        }

        $ringSizes = fn () => collect(['12', '14', '16', '18', '20'])->map(fn ($s, $i) => [
            'label' => "Talle {$s}", 'type' => 'talle', 'value' => $s, 'stock' => 3 + $i,
        ])->all();

        $material = fn (int $base) => [
            ['label' => 'Plata 925', 'type' => 'material', 'value' => 'Plata 925', 'stock' => 8, 'price_delta' => 0],
            ['label' => 'Oro 18k', 'type' => 'material', 'value' => 'Oro 18k', 'stock' => 4, 'price_delta' => (int) round($base * 0.6)],
        ];

        $products = [
            ['slug' => 'anillo-solitario-aura', 'name' => 'Anillo Solitario Aura', 'cat' => 'anillos', 'price' => 89000, 'compare' => 119000, 'rating' => 4.8, 'reviews' => 36, 'badges' => ['oferta', 'destacado'], 'imgs' => ['/assets/img/product/4/product-1.jpg', '/assets/img/product/details/4/main/product-details-main-1.jpg'], 'variants' => $ringSizes()],
            ['slug' => 'collar-gota-celeste', 'name' => 'Collar Gota Celeste', 'cat' => 'collares', 'price' => 76000, 'rating' => 4.9, 'reviews' => 21, 'badges' => ['nuevo'], 'imgs' => ['/assets/img/product/4/product-2.jpg'], 'variants' => [['label' => 'Largo 40 cm', 'type' => 'largo', 'value' => '40', 'stock' => 6], ['label' => 'Largo 45 cm', 'type' => 'largo', 'value' => '45', 'stock' => 5, 'price_delta' => 4000]]],
            ['slug' => 'aros-argolla-luna', 'name' => 'Aros Argolla Luna', 'cat' => 'aros', 'price' => 42000, 'compare' => 52000, 'rating' => 4.7, 'reviews' => 48, 'badges' => ['oferta'], 'imgs' => ['/assets/img/product/4/product-3.jpg'], 'variants' => $material(42000)],
            ['slug' => 'pulsera-esclava-vienna', 'name' => 'Pulsera Esclava Vienna', 'cat' => 'pulseras', 'price' => 64000, 'rating' => 4.6, 'reviews' => 14, 'badges' => [], 'imgs' => ['/assets/img/product/4/product-4.jpg'], 'variants' => [['label' => 'Dorado', 'type' => 'color', 'value' => 'Dorado', 'stock' => 7], ['label' => 'Plateado', 'type' => 'color', 'value' => 'Plateado', 'stock' => 9]]],
            ['slug' => 'conjunto-perla-margot', 'name' => 'Conjunto Perla Margot', 'cat' => 'conjuntos', 'price' => 138000, 'compare' => 165000, 'rating' => 5, 'reviews' => 9, 'badges' => ['oferta', 'destacado'], 'imgs' => ['/assets/img/product/4/product-5.jpg'], 'stock' => 6, 'variants' => []],
            ['slug' => 'anillo-eternity-pave', 'name' => 'Anillo Eternity Pavé', 'cat' => 'anillos', 'price' => 112000, 'rating' => 4.8, 'reviews' => 17, 'badges' => ['destacado'], 'imgs' => ['/assets/img/product/4/product-6.jpg'], 'variants' => $ringSizes()],
            ['slug' => 'collar-iniciales-lettre', 'name' => 'Collar Iniciales Lettre', 'cat' => 'collares', 'price' => 58000, 'rating' => 4.9, 'reviews' => 31, 'badges' => ['nuevo'], 'imgs' => ['/assets/img/product/4/product-7.jpg'], 'variants' => [['label' => 'Letra A', 'type' => 'color', 'value' => 'A', 'stock' => 4], ['label' => 'Letra M', 'type' => 'color', 'value' => 'M', 'stock' => 4], ['label' => 'Letra S', 'type' => 'color', 'value' => 'S', 'stock' => 4]]],
            ['slug' => 'aros-pendientes-gala', 'name' => 'Aros Pendientes Gala', 'cat' => 'aros', 'price' => 95000, 'compare' => 124000, 'rating' => 4.7, 'reviews' => 12, 'badges' => ['oferta'], 'imgs' => ['/assets/img/product/4/product-8.jpg'], 'stock' => 8, 'variants' => []],
            ['slug' => 'pulsera-tennis-brillante', 'name' => 'Pulsera Tennis Brillante', 'cat' => 'pulseras', 'price' => 156000, 'rating' => 5, 'reviews' => 8, 'badges' => ['destacado'], 'imgs' => ['/assets/img/product/4/product-9.jpg'], 'stock' => 5, 'variants' => []],
            ['slug' => 'collar-choker-onda', 'name' => 'Collar Choker Onda', 'cat' => 'collares', 'price' => 49000, 'compare' => 62000, 'rating' => 4.5, 'reviews' => 19, 'badges' => ['oferta'], 'imgs' => ['/assets/img/product/4/product-10.jpg'], 'stock' => 14, 'variants' => []],
            ['slug' => 'anillo-sello-monograma', 'name' => 'Anillo Sello Monograma', 'cat' => 'anillos', 'price' => 71000, 'rating' => 4.6, 'reviews' => 7, 'badges' => [], 'imgs' => ['/assets/img/product/4/product-11.jpg'], 'variants' => $ringSizes()],
            ['slug' => 'reloj-minimal-petite', 'name' => 'Reloj Minimal Petite', 'cat' => 'relojes', 'price' => 134000, 'compare' => 159000, 'rating' => 4.8, 'reviews' => 5, 'badges' => ['oferta', 'nuevo'], 'imgs' => ['/assets/img/product/4/product-12.jpg'], 'variants' => [['label' => 'Dorado', 'type' => 'color', 'value' => 'Dorado', 'stock' => 4], ['label' => 'Plateado', 'type' => 'color', 'value' => 'Plateado', 'stock' => 6]]],
            ['slug' => 'aros-perla-clasica', 'name' => 'Aros Perla Clásica', 'cat' => 'aros', 'price' => 38000, 'compare' => 45000, 'rating' => 4.6, 'reviews' => 22, 'badges' => ['oferta'], 'imgs' => ['/assets/img/product/4/product-3.jpg'], 'variants' => $material(38000)],
            ['slug' => 'collar-cadena-figaro', 'name' => 'Collar Cadena Figaro', 'cat' => 'collares', 'price' => 67000, 'rating' => 4.7, 'reviews' => 11, 'badges' => [], 'imgs' => ['/assets/img/product/4/product-2.jpg'], 'variants' => [['label' => 'Largo 45 cm', 'type' => 'largo', 'value' => '45', 'stock' => 7], ['label' => 'Largo 50 cm', 'type' => 'largo', 'value' => '50', 'stock' => 5, 'price_delta' => 6000]]],
            ['slug' => 'anillo-compromiso-solitario', 'name' => 'Anillo Compromiso Solitario', 'cat' => 'anillos', 'price' => 240000, 'compare' => 290000, 'rating' => 5, 'reviews' => 14, 'badges' => ['oferta', 'destacado'], 'imgs' => ['/assets/img/product/4/product-1.jpg'], 'variants' => $ringSizes()],
            ['slug' => 'pulsera-rigida-minimal', 'name' => 'Pulsera Rígida Minimal', 'cat' => 'pulseras', 'price' => 52000, 'rating' => 4.5, 'reviews' => 9, 'badges' => ['nuevo'], 'imgs' => ['/assets/img/product/4/product-4.jpg'], 'stock' => 18, 'variants' => []],
            ['slug' => 'conjunto-novia-aurora', 'name' => 'Conjunto Novia Aurora', 'cat' => 'conjuntos', 'price' => 198000, 'compare' => 245000, 'rating' => 5, 'reviews' => 6, 'badges' => ['oferta', 'destacado'], 'imgs' => ['/assets/img/product/4/product-5.jpg'], 'stock' => 5, 'variants' => []],
            ['slug' => 'aros-argolla-mini', 'name' => 'Aros Argolla Mini', 'cat' => 'aros', 'price' => 29000, 'rating' => 4.8, 'reviews' => 41, 'badges' => [], 'imgs' => ['/assets/img/product/4/product-8.jpg'], 'variants' => $material(29000)],
            ['slug' => 'collar-dije-corazon', 'name' => 'Collar Dije Corazón', 'cat' => 'collares', 'price' => 45000, 'compare' => 58000, 'rating' => 4.9, 'reviews' => 27, 'badges' => ['oferta', 'nuevo'], 'imgs' => ['/assets/img/product/4/product-10.jpg'], 'stock' => 16, 'variants' => []],
            ['slug' => 'reloj-cuero-classic', 'name' => 'Reloj Cuero Classic', 'cat' => 'relojes', 'price' => 98000, 'rating' => 4.6, 'reviews' => 8, 'badges' => [], 'imgs' => ['/assets/img/product/4/product-12.jpg'], 'variants' => [['label' => 'Marrón', 'type' => 'color', 'value' => 'Marrón', 'stock' => 6], ['label' => 'Negro', 'type' => 'color', 'value' => 'Negro', 'stock' => 8]]],
        ];

        $waNumber = env('PETTY_WA_NUMBER', '5491100000000');
        $waUrl = fn (string $name) => 'https://wa.me/'.$waNumber.'?text='.urlencode('Hola! Me interesa el producto: '.$name);

        foreach ($products as $p) {
            $product = Product::updateOrCreate(['slug' => $p['slug']], [
                'name' => $p['name'],
                'category_id' => $catIds[$p['cat']],
                'price' => $p['price'],
                'compare_at_price' => $p['compare'] ?? null,
                'short_description' => $p['name'].' — joya de autor en oro y plata.',
                'description' => 'Pieza elaborada y controlada a mano en nuestro taller. Materiales nobles y terminación impecable.',
                'specs' => ['material' => $p['variants'][0]['value'] ?? 'Plata 925', 'garantia' => 'De por vida en el armado'],
                'rating' => $p['rating'],
                'reviews_count' => $p['reviews'],
                'badges' => $p['badges'],
                'whatsapp_url' => $waUrl($p['name']),
                'active' => true,
            ]);

            // Código de barras interno corto (6 dígitos) — legible con pistola.
            $product->update(['barcode' => \App\Actions\Products\CreateProductAction::productBarcode($product->id)]);

            $product->images()->delete();
            foreach ($p['imgs'] as $pos => $url) {
                $product->images()->create(['url' => $url, 'position' => $pos]);
            }

            $product->variants()->delete();
            $product->stockMovements()->delete();

            if (! empty($p['variants'])) {
                foreach ($p['variants'] as $vi => $v) {
                    $variant = $product->variants()->create([
                        'label' => $v['label'],
                        'type' => $v['type'],
                        'value' => $v['value'],
                        'sku' => strtoupper(str_replace('-', '', $p['slug']))."-{$vi}",
                        'price_delta' => $v['price_delta'] ?? 0,
                    ]);
                    $variant->update(['barcode' => \App\Actions\Products\CreateProductAction::variantBarcode($variant->id)]);
                    $product->stockMovements()->create([
                        'product_variant_id' => $variant->id,
                        'type' => StockMovementType::Purchase,
                        'quantity' => $v['stock'],
                        'note' => 'Carga inicial (seed)',
                    ]);
                }
            } elseif (isset($p['stock'])) {
                $product->stockMovements()->create([
                    'type' => StockMovementType::Purchase,
                    'quantity' => $p['stock'],
                    'note' => 'Carga inicial (seed)',
                ]);
            }
        }
    }
}

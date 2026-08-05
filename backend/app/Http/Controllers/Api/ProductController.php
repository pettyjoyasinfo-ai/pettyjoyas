<?php

namespace App\Http\Controllers\Api;

use App\Actions\Products\CreateProductAction;
use App\Actions\Products\UpdateProductAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\Inventory\InventoryService;
use App\Services\Discounts\DiscountService;
use App\Support\RevalidateFrontend;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        private InventoryService $inventory,
        private DiscountService $discounts,
    ) {}

    public function index(Request $request)
    {
        $query = Product::query()->with(['category', 'variants', 'images'])->where('active', true);

        // La tienda pública no debe listar productos sin stock (ni el simple ni
        // el que tiene TODAS sus variantes en 0) — pero el panel admin sigue
        // viéndolos todos, para poder reponerlos. Alcanza con que UNA variante
        // tenga stock para que el producto siga apareciendo.
        if (! $request->user('sanctum')?->isStaff()) {
            $this->hideOutOfStock($query);
        }

        if ($cat = $request->query('categoria')) {
            // Include products in subcategories of the selected category.
            $slugs = [$cat];
            $parent = \App\Models\Category::where('slug', $cat)->first();
            if ($parent) {
                $slugs = array_merge($slugs, \App\Models\Category::where('parent_id', $parent->id)->pluck('slug')->toArray());
            }
            $query->whereHas('category', fn ($q) => $q->whereIn('slug', $slugs));
        }
        if ($col = $request->query('coleccion')) {
            $query->where('collection', $col);
        }
        if ($mat = $request->query('material')) {
            $query->where(function ($q) use ($mat) {
                $q->whereHas('variants', fn ($v) => $v->where('type', 'material')->where('value', 'like', "%{$mat}%"))
                    ->orWhere('specs->material', 'like', "%{$mat}%");
            });
        }
        if ($request->filled('min')) {
            $query->where('price', '>=', (int) $request->query('min'));
        }
        if ($request->filled('max')) {
            $query->where('price', '<=', (int) $request->query('max'));
        }
        if ($request->boolean('oferta')) {
            $query->whereNotNull('compare_at_price')->whereColumn('compare_at_price', '>', 'price');
        }
        if ($q = $request->query('q')) {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('short_description', 'like', "%{$q}%")
                    ->orWhere('collection', 'like', "%{$q}%");
            });
        }

        match ($request->query('orden')) {
            'precio-asc' => $query->orderBy('price'),
            'precio-desc' => $query->orderByDesc('price'),
            'nuevos' => $query->orderByDesc('created_at'),
            default => $query->orderByDesc('rating'),
        };

        $products = $query->get()->each(fn (Product $p) => $this->attachStock($p));
        $this->discounts->decorate($products, $request->query('promo'));

        return ProductResource::collection($products);
    }

    public function show(Product $product, Request $request)
    {
        $product->load(['category', 'variants', 'images']);

        // Mismo criterio que index(): sin stock en ninguna variante (o en el
        // producto simple), no es accesible para clientes — ni por link directo.
        if (! $request->user('sanctum')?->isStaff()) {
            $hasStock = $product->variants->isNotEmpty()
                ? $product->variants->contains(fn ($v) => $v->stock > 0)
                : $product->stock > 0;
            abort_if(! $hasStock, 404);
        }

        $this->attachStock($product);
        $this->discounts->decorate([$product], $request->query('promo'));

        return new ProductResource($product);
    }

    /**
     * Variantes más usadas, agrupadas por tipo (material, talle, etc.), para
     * reutilizar al cargar productos en serie. Se DERIVAN del catálogo real:
     * cuanto más se usa un valor, más arriba aparece. No requiere tabla aparte.
     */
    public function variantSuggestions()
    {
        $rows = \App\Models\ProductVariant::query()
            ->selectRaw('type, value, COUNT(*) as uses')
            ->whereNotNull('value')
            ->where('value', '!=', '')
            ->groupBy('type', 'value')
            ->orderByDesc('uses')
            ->get();

        $grouped = $rows->groupBy('type')->map(
            fn ($items) => $items->map(fn ($r) => [
                'value' => $r->value,
                'uses' => (int) $r->uses,
            ])->values()
        );

        return response()->json($grouped);
    }

    /** Búsqueda por código de barras (scanner del POS / inventario). */
    public function lookup(Request $request)
    {
        $barcode = $request->query('barcode');

        $product = Product::with(['category', 'variants', 'images'])
            ->where('barcode', $barcode)
            ->orWhereHas('variants', fn ($v) => $v->where('barcode', $barcode))
            ->firstOrFail();

        $this->attachStock($product);

        // Si el código escaneado es el de una variante puntual (no el del
        // producto), lo indicamos aparte: el POS agrega esa variante directo
        // al ticket sin pedirle al cajero que la elija de nuevo.
        // ->resolve() evita el wrapper "data" (acá la respuesta va sin envolver,
        // igual que el resto de los endpoints de producto).
        $matchedVariant = $product->variants->firstWhere('barcode', $barcode);

        return response()->json([
            ...(new ProductResource($product))->resolve($request),
            'matchedVariantId' => $matchedVariant ? (string) $matchedVariant->id : null,
        ]);
    }

    public function store(StoreProductRequest $request, CreateProductAction $action)
    {
        $product = $action->execute($request->validated(), $request->user()->id);
        $this->attachStock($product);
        RevalidateFrontend::product($product->slug);

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function update(UpdateProductRequest $request, Product $product, UpdateProductAction $action)
    {
        $product = $action->execute($product, $request->validated());
        $this->attachStock($product);
        RevalidateFrontend::product($product->slug);

        return new ProductResource($product);
    }

    public function destroy(Product $product)
    {
        // Archivado: se oculta del catálogo, no se borra (preserva historial/stock).
        $product->update(['active' => false]);
        RevalidateFrontend::product($product->slug);

        return response()->noContent();
    }

    /**
     * Guarda los dos datos manuales del módulo de Etiquetas (ej. referencia
     * de proveedor y peso/multiplicador) en el producto o, si se manda
     * variant_id, en esa variante puntual — para no tener que recargarlos
     * cada vez que se generan etiquetas nuevas.
     */
    public function updateLabelInfo(Request $request, Product $product)
    {
        $data = $request->validate([
            'variant_id'   => ['nullable', 'integer'],
            'label_ref'    => ['nullable', 'string', 'max:60'],
            'label_weight' => ['nullable', 'string', 'max:60'],
        ]);

        $target = $data['variant_id'] ?? null
            ? ProductVariant::where('product_id', $product->id)->findOrFail($data['variant_id'])
            : $product;

        $target->update([
            'label_ref'    => $data['label_ref'] ?? null,
            'label_weight' => $data['label_weight'] ?? null,
        ]);

        return response()->json([
            'labelRef'    => $target->label_ref,
            'labelWeight' => $target->label_weight,
        ]);
    }

    /**
     * Filtra productos sin stock real (columna directa, sin descontar
     * reservas de carrito — eso es un estado temporario, no "no hay más").
     * Un producto con variantes se considera con stock si CUALQUIERA de
     * ellas tiene stock > 0; uno sin variantes, si su propio stock > 0.
     */
    private function hideOutOfStock($query): void
    {
        $query->where(function ($q) {
            $q->whereHas('variants', fn ($v) => $v->where('stock', '>', 0))
                ->orWhere(function ($q2) {
                    $q2->whereDoesntHave('variants')->where('stock', '>', 0);
                });
        });
    }

    /** Inyecta stock disponible (columna directa menos reservas de carrito) en el modelo. */
    private function attachStock(Product $product): void
    {
        $byVariant = $this->inventory->stockByVariant($product->id);

        if ($product->variants->isNotEmpty()) {
            // Stock total del producto = suma de variantes disponibles.
            $product->stock_total = array_sum($byVariant);
        } else {
            $product->stock_total = $this->inventory->currentStock($product->id);
        }

        $product->variants->each(function ($variant) use ($byVariant) {
            $variant->stock = $byVariant[$variant->id] ?? 0;
        });
    }
}

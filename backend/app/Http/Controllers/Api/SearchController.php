<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Services\Inventory\InventoryService;
use App\Support\BusinessTime;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request, InventoryService $inventory)
    {
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['products' => [], 'orders' => [], 'customers' => []]);
        }

        $like = "%{$q}%";
        $needle = mb_strtolower($q);

        $products = Product::where('active', true)
            ->with([
                'category:id,name,parent_id',
                'category.parent:id,name',
                'images',
                'variants:id,product_id,label,sku,barcode,stock',
            ])
            // El SKU y el código de barras viven en las variantes, aunque el producto simple también puede tener barcode.
            ->where(fn ($w) => $w
                ->where('name', 'like', $like)
                ->orWhere('barcode', 'like', $like)
                ->orWhereHas('variants', fn ($v) => $v->where('sku', 'like', $like)->orWhere('barcode', 'like', $like)))
            ->limit(6)
            ->get(['id', 'name', 'slug', 'price', 'stock', 'hidden', 'category_id', 'barcode']);

        $availability = $inventory->availabilityFor($products);

        $orders = Order::with(['customer:id,name,email', 'items:id,order_id,name,variant_label,quantity'])
            ->where(fn ($w) => $w
                ->where('number', 'like', $like)
                ->orWhereHas('customer', fn ($c) => $c
                    ->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                )
                ->orWhereHas('items', fn ($i) => $i
                    ->where('name', 'like', $like)
                    ->orWhere('variant_label', 'like', $like)
                )
            )
            ->latest()
            ->limit(5)
            ->get();

        $customers = Customer::where(fn ($w) => $w
            ->where('name', 'like', $like)
            ->orWhere('email', 'like', $like)
            ->orWhere('phone', 'like', $like)
        )
        ->limit(5)
        ->get(['id', 'name', 'email']);

        return response()->json([
            'products' => $products->map(function ($p) use ($availability) {
                $cat = $p->category
                    ? ($p->category->parent ? "{$p->category->parent->name} › {$p->category->name}" : $p->category->name)
                    : null;

                return [
                    'id'            => $p->id,
                    'label'         => $p->name,
                    // Los precios se guardan en pesos enteros, no en centavos.
                    'sub'           => '$ ' . number_format($p->price, 0, ',', '.'),
                    'href'          => "/admin/productos/{$p->slug}/editar",
                    'image'         => $p->images->first()?->url,
                    'category'      => $cat,
                    'stock'         => (int) ($availability[$p->id]['total'] ?? $p->stock ?? 0),
                    'variantsCount' => $p->variants->count(),
                    'hidden'        => (bool) $p->hidden,
                ];
            })->values(),
            'orders' => $orders->map(function ($o) use ($needle) {
                $matchedItem = $o->items->first(fn ($it) => str_contains(mb_strtolower((string) $it->name), $needle)
                    || str_contains(mb_strtolower((string) $it->variant_label), $needle))
                    ?? $o->items->first();

                $itemText = $matchedItem
                    ? ($matchedItem->variant_label
                        ? "{$matchedItem->name} ({$matchedItem->variant_label})"
                        : $matchedItem->name)
                    : null;

                $who = $o->customer?->name ?: ($o->channel?->value === 'local' ? 'Venta presencial' : null);
                $date = $o->created_at?->copy()->setTimezone(BusinessTime::TZ)->format('d/m/Y');

                return [
                    'id'    => $o->id,
                    'label' => $o->number,
                    'sub'   => '$ ' . number_format((int) $o->total, 0, ',', '.'),
                    'meta'  => implode(' · ', array_filter([$who, $date, $itemText])),
                    'href'  => "/admin/pedidos/{$o->id}",
                ];
            })->values(),
            'customers' => $customers->map(fn ($c) => [
                'id'    => $c->id,
                'label' => $c->name,
                'sub'   => $c->email,
                'href'  => "/admin/clientes/{$c->id}",
            ])->values(),
        ]);
    }
}

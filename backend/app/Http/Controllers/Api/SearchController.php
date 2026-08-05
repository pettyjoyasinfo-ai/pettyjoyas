<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->query('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['products' => [], 'orders' => [], 'customers' => []]);
        }

        $like = "%{$q}%";

        $products = Product::where('active', true)
            ->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('sku', 'like', $like))
            ->limit(5)
            ->get(['id', 'name', 'slug', 'price']);

        $orders = Order::with('customer:id,name,email')
            ->where(fn ($w) => $w
                ->where('number', 'like', $like)
                ->orWhereHas('customer', fn ($c) => $c
                    ->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
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
            'products' => $products->map(fn ($p) => [
                'id'    => $p->id,
                'label' => $p->name,
                'sub'   => '$ ' . number_format($p->price / 100, 0, ',', '.'),
                'href'  => '/admin/productos',
            ]),
            'orders' => $orders->map(fn ($o) => [
                'id'    => $o->id,
                'label' => $o->number,
                'sub'   => $o->customer?->name ?? '',
                'href'  => "/admin/pedidos/{$o->id}",
            ]),
            'customers' => $customers->map(fn ($c) => [
                'id'    => $c->id,
                'label' => $c->name,
                'sub'   => $c->email,
                'href'  => "/admin/clientes/{$c->id}",
            ]),
        ]);
    }
}

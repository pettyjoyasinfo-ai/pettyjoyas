<?php

namespace App\Http\Controllers\Api;

use App\Actions\Sales\CreateExchangeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExchangeRequest;
use App\Http\Resources\ExchangeResource;
use App\Models\Exchange;
use Illuminate\Http\Request;

/** Cambios y devoluciones desde caja (solo staff). */
class ExchangeController extends Controller
{
    /** GET /pos/exchanges — historial, lo más reciente primero. */
    public function index(Request $request)
    {
        $limit = min(200, max(1, (int) $request->query('limit', 50)));

        $exchanges = Exchange::with(['items', 'user', 'originalOrder'])
            ->latest('id')
            ->take($limit)
            ->get();

        return ExchangeResource::collection($exchanges);
    }

    /** POST /pos/exchanges */
    public function store(StoreExchangeRequest $request, CreateExchangeAction $action)
    {
        $exchange = $action->execute($request->validated(), $request->user()->id);

        return (new ExchangeResource($exchange))->response()->setStatusCode(201);
    }

    /**
     * GET /pos/exchanges/order/{number} — qué se puede devolver de una venta (lo comprado
     * menos lo ya devuelto), para armar el cambio sin tipear los artículos.
     */
    public function order(string $number, CreateExchangeAction $action)
    {
        $order = $action->findOriginalOrder($number);
        $left = $action->returnableByKey($order);

        $items = $order->items
            ->filter(fn ($it) => $it->product_id)
            ->map(function ($it) use ($left) {
                $key = $it->product_id.'-'.($it->product_variant_id ?? 0);

                return [
                    'productId' => $it->product_id,
                    'variantId' => $it->product_variant_id,
                    'name' => $it->name,
                    'variantLabel' => $it->variant_label,
                    'image' => $it->image,
                    'unitPrice' => (int) $it->unit_price,
                    'bought' => (int) $it->quantity,
                    'returnable' => (int) ($left[$key] ?? 0),
                ];
            })
            ->values();

        return response()->json([
            'number' => $order->number,
            'createdAt' => $order->created_at?->toIso8601String(),
            'paymentMethod' => $order->payment_method,
            'total' => (int) $order->total,
            'items' => $items,
        ]);
    }
}

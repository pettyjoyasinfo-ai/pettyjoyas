<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index()
    {
        // Pedidos esperando atención del equipo
        $pendingOrders = Order::where('status', OrderStatus::Pendiente)->count();

        // Productos activos a los que les queda exactamente 1 unidad: con variantes
        // se suma el stock de todas; sin variantes cuenta el stock del propio producto.
        $lowStockCount = DB::table('products')
            ->leftJoinSub(
                DB::table('product_variants')
                    ->selectRaw('product_id, SUM(stock) as total')
                    ->groupBy('product_id'),
                'pv',
                'products.id',
                '=',
                'pv.product_id'
            )
            ->where('products.active', true)
            ->whereRaw('COALESCE(pv.total, products.stock, 0) = 1')
            ->count();

        // Clientes registrados en las últimas 24 h
        $newCustomers = Customer::where('created_at', '>=', now()->subDay())->count();

        $items = [];

        if ($pendingOrders > 0) {
            $items[] = [
                'type'  => 'pending_orders',
                'label' => $pendingOrders === 1
                    ? '1 pedido pendiente'
                    : "{$pendingOrders} pedidos pendientes",
                'href'  => '/admin/pedidos',
                'count' => $pendingOrders,
            ];
        }

        if ($lowStockCount > 0) {
            $items[] = [
                'type'  => 'low_stock',
                'label' => $lowStockCount === 1
                    ? '1 producto con stock bajo'
                    : "{$lowStockCount} productos con stock bajo",
                'href'  => '/admin/productos',
                'count' => $lowStockCount,
            ];
        }

        if ($newCustomers > 0) {
            $items[] = [
                'type'  => 'new_customers',
                'label' => $newCustomers === 1
                    ? '1 cliente nuevo hoy'
                    : "{$newCustomers} clientes nuevos hoy",
                'href'  => '/admin/clientes',
                'count' => $newCustomers,
            ];
        }

        return response()->json([
            'total' => $pendingOrders + $lowStockCount + $newCustomers,
            'items' => $items,
        ]);
    }
}

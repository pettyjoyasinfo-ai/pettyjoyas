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

        // Productos activos con stock total < 5 (calculado desde stock_movements)
        $lowStockCount = DB::table('products')
            ->leftJoinSub(
                DB::table('stock_movements')
                    ->selectRaw('product_id, SUM(quantity) as total')
                    ->groupBy('product_id'),
                'sm',
                'products.id',
                '=',
                'sm.product_id'
            )
            ->where('products.active', true)
            ->whereRaw('COALESCE(sm.total, 0) < 5')
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

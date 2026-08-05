<?php

namespace App\Services\Reports;

use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Metricas del negocio. Las ventas validas son las pagadas/posteriores
 * (status != cancelado). Todos los montos en ARS (enteros).
 */
class ReportService
{
    private function paidOrders()
    {
        return Order::where('status', '!=', 'cancelado');
    }

    public function dashboard(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $orders  = $this->paidOrders()->whereBetween('created_at', [$from, $to]);
        $count   = (clone $orders)->count();
        $revenue = (int) (clone $orders)->sum('total');

        return [
            'revenue'      => $revenue,
            'orders'       => $count,
            'avgTicket'    => $count ? intdiv($revenue, $count) : 0,
            'newCustomers' => Customer::whereBetween('created_at', [$from, $to])->count(),
        ];
    }

    private static function monthLabel(CarbonImmutable $d): string
    {
        $months = [
            1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril',
            5 => 'mayo', 6 => 'junio', 7 => 'julio', 8 => 'agosto',
            9 => 'septiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre',
        ];
        return $months[$d->month] . ' ' . $d->year;
    }

    /** Compara un periodo contra el inmediatamente anterior de igual duracion. */
    public function comparison(string $period, ?CarbonImmutable $customFrom = null, ?CarbonImmutable $customTo = null): array
    {
        $now = CarbonImmutable::now();

        if ($period === 'custom' && $customFrom !== null && $customTo !== null) {
            $duration = (int) $customFrom->diffInSeconds($customTo);
            $prevTo   = $customFrom->subSecond();
            $prevFrom = $prevTo->subSeconds($duration);

            $curLabel  = $customFrom->format('d/m/Y') . ' - ' . $customTo->format('d/m/Y');
            $prevLabel = $prevFrom->format('d/m/Y') . ' - ' . $prevTo->format('d/m/Y');

            return [
                'period'   => 'custom',
                'current'  => array_merge(['label' => $curLabel],  $this->dashboard($customFrom, $customTo)),
                'previous' => array_merge(['label' => $prevLabel], $this->dashboard($prevFrom, $prevTo)),
            ];
        }

        if ($period === 'anual') {
            $curFrom  = $now->startOfYear();
            $curTo    = $now;
            $prevFrom = $now->subYear()->startOfYear();
            $prevTo   = $now->subYear();
            $labelCur  = (string) $now->year;
            $labelPrev = (string) $now->subYear()->year;
        } elseif ($period === 'trimestral') {
            $curFrom  = $now->startOfQuarter();
            $curTo    = $now;
            $prevFrom = $now->subQuarter()->startOfQuarter();
            $prevTo   = $now->subQuarter()->endOfQuarter();
            $labelCur  = 'Trimestre actual';
            $labelPrev = 'Trimestre anterior';
        } else {
            $curFrom  = $now->startOfMonth();
            $curTo    = $now;
            $prevFrom = $now->subMonth()->startOfMonth();
            $prevTo   = $now->subMonth()->endOfMonth();
            $labelCur  = self::monthLabel($now);
            $labelPrev = self::monthLabel($now->subMonth());
        }

        return [
            'period'   => $period,
            'current'  => array_merge(['label' => $labelCur],  $this->dashboard($curFrom, $curTo)),
            'previous' => array_merge(['label' => $labelPrev], $this->dashboard($prevFrom, $prevTo)),
        ];
    }

    public function topProducts(int $limit = 5): array
    {
        return OrderItem::select('name', DB::raw('SUM(quantity) as sold'), DB::raw('SUM(unit_price * quantity) as revenue'))
            ->groupBy('name')
            ->orderByDesc('sold')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'sold' => (int) $r->sold, 'revenue' => (int) $r->revenue])
            ->all();
    }

    public function topCustomers(int $limit = 5): array
    {
        return Customer::withCount('orders')->withSum('orders', 'total')
            ->orderByDesc('orders_sum_total')
            ->limit($limit)
            ->get()
            ->map(fn ($c) => [
                'name'    => $c->name,
                'segment' => $c->segment?->value,
                'orders'  => (int) $c->orders_count,
                'ltv'     => (int) ($c->orders_sum_total ?? 0),
            ])
            ->all();
    }

    public function couponPerformance(): array
    {
        return Coupon::all()->map(function ($c) {
            $agg = DB::table('coupon_redemptions')
                ->where('coupon_id', $c->id)
                ->selectRaw('COUNT(*) uses, COALESCE(SUM(amount),0) discount')
                ->first();

            $revenue = (int) DB::table('orders')
                ->where('coupon_code', $c->code)
                ->where('status', '!=', 'cancelado')
                ->sum('total');

            return [
                'code'     => $c->code,
                'uses'     => (int) $agg->uses,
                'discount' => (int) $agg->discount,
                'revenue'  => $revenue,
            ];
        })->all();
    }
}

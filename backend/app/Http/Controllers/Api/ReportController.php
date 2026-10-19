<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Reports\ReportService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function dashboard(Request $request)
    {
        $to = CarbonImmutable::now();
        $from = $to->subDays((int) $request->query('dias', 30));

        return response()->json([
            ...$this->reports->dashboard($from, $to),
            'topProducts' => $this->reports->topProducts(),
        ]);
    }

    /** Comparativa mensual | trimestral | anual | custom contra el período anterior. */
    public function comparison(Request $request)
    {
        $period     = $request->query('periodo', 'mensual');
        // Hora argentina (el servicio la pasa a UTC para consultar la base).
        $customFrom = $request->query('from') ? \App\Support\BusinessTime::startOfDay($request->query('from')) : null;
        $customTo   = $request->query('to')   ? \App\Support\BusinessTime::endOfDay($request->query('to'))     : null;

        return response()->json($this->reports->comparison($period, $customFrom, $customTo));
    }

    public function topProducts()
    {
        return response()->json($this->reports->topProducts(10));
    }

    public function topCustomers()
    {
        return response()->json($this->reports->topCustomers(10));
    }

    public function coupons()
    {
        return response()->json($this->reports->couponPerformance());
    }

    /**
     * Ingresos desglosados por canal × método de pago.
     * Acepta ?from=YYYY-MM-DD&to=YYYY-MM-DD o ?dias=N (default 30).
     */
    public function paymentBreakdown(Request $request)
    {
        if ($request->query('from') && $request->query('to')) {
            $from = \App\Support\BusinessTime::startOfDay($request->query('from'))?->utc() ?? CarbonImmutable::now()->subDays(30);
            $to   = \App\Support\BusinessTime::endOfDay($request->query('to'))?->utc() ?? CarbonImmutable::now();
        } else {
            $days = (int) $request->query('dias', 30);
            $to   = CarbonImmutable::now();
            $from = \App\Support\BusinessTime::startOfDay($to->subDays($days)->setTimezone(\App\Support\BusinessTime::TZ)->toDateString())->utc();
        }

        $rows = Order::query()
            ->whereIn('status', ['pagado', 'preparacion', 'enviado', 'entregado'])
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('channel, payment_method, COUNT(*) as count, SUM(total) as total')
            ->groupBy('channel', 'payment_method')
            ->orderBy('channel')
            ->orderBy('payment_method')
            ->get()
            ->map(fn ($r) => [
                'channel'       => $r->channel,
                'paymentMethod' => $r->payment_method,
                'count'         => (int) $r->count,
                'total'         => (int) $r->total,
            ]);

        return response()->json(['breakdown' => $rows]);
    }
}

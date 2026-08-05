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
        $customFrom = $request->query('from') ? CarbonImmutable::parse($request->query('from'))->startOfDay() : null;
        $customTo   = $request->query('to')   ? CarbonImmutable::parse($request->query('to'))->endOfDay()   : null;

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
            $from = CarbonImmutable::parse($request->query('from'))->startOfDay();
            $to   = CarbonImmutable::parse($request->query('to'))->endOfDay();
        } else {
            $days = (int) $request->query('dias', 30);
            $to   = CarbonImmutable::now();
            $from = $to->subDays($days)->startOfDay();
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

@props(['order'])

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:8px;">
    <thead>
        <tr>
            <th align="left" style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#9a9a9a; padding:0 0 10px; border-bottom:1px solid #ececec;">Producto</th>
            <th align="center" style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#9a9a9a; padding:0 0 10px; border-bottom:1px solid #ececec;">Cant.</th>
            <th align="right" style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#9a9a9a; padding:0 0 10px; border-bottom:1px solid #ececec;">Importe</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($order->items as $item)
            <tr>
                <td align="left" style="font-size:14px; color:#2b2b2b; padding:12px 0; border-bottom:1px solid #f3f3f3;">
                    {{ $item->name }}
                    @if ($item->variant_label)
                        <span style="color:#9a9a9a; font-size:12px;">· {{ $item->variant_label }}</span>
                    @endif
                </td>
                <td align="center" style="font-size:14px; color:#5a5a5a; padding:12px 0; border-bottom:1px solid #f3f3f3;">{{ $item->quantity }}</td>
                <td align="right" style="font-size:14px; color:#2b2b2b; padding:12px 0; border-bottom:1px solid #f3f3f3;">${{ number_format($item->unit_price * $item->quantity, 0, ',', '.') }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:14px;">
    <tr>
        <td align="right" style="font-size:13px; color:#6a6a6a; padding:3px 0;">Subtotal</td>
        <td align="right" width="120" style="font-size:13px; color:#2b2b2b; padding:3px 0;">${{ number_format($order->subtotal, 0, ',', '.') }}</td>
    </tr>
    @if ($order->discount > 0)
        <tr>
            <td align="right" style="font-size:13px; color:#821f40; padding:3px 0;">Descuento{{ $order->coupon_code ? ' ('.$order->coupon_code.')' : '' }}</td>
            <td align="right" style="font-size:13px; color:#821f40; padding:3px 0;">-${{ number_format($order->discount, 0, ',', '.') }}</td>
        </tr>
    @endif
    @if ($order->shipping_cost > 0)
        <tr>
            <td align="right" style="font-size:13px; color:#6a6a6a; padding:3px 0;">Envío</td>
            <td align="right" style="font-size:13px; color:#2b2b2b; padding:3px 0;">${{ number_format($order->shipping_cost, 0, ',', '.') }}</td>
        </tr>
    @endif
    <tr>
        <td align="right" style="font-size:16px; font-weight:700; color:#2b2b2b; padding:10px 0 0; border-top:2px solid #ececec;">Total</td>
        <td align="right" style="font-size:16px; font-weight:700; color:#821f40; padding:10px 0 0; border-top:2px solid #ececec;">${{ number_format($order->total, 0, ',', '.') }}</td>
    </tr>
</table>

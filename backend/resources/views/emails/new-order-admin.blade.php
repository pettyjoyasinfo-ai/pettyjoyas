@php
    $frontend = rtrim(config('app.frontend_url', ''), '/');
    $methods = ['mercadopago' => 'MercadoPago', 'transferencia' => 'Transferencia', 'efectivo' => 'Efectivo', 'tarjeta_credito' => 'Tarjeta de crédito (WhatsApp)'];
    $methodLabel = $methods[$order->payment_method] ?? ($order->payment_method ?? '—');
    $channelLabel = $order->channel?->value === 'local' ? 'Venta presencial (POS)' : 'Tienda online';
@endphp

<x-emails.layout title="Nuevo pedido {{ $order->number }}"
                 preheader="Nuevo pedido {{ $order->number }} por ${{ number_format($order->total, 0, ',', '.') }} ({{ $methodLabel }}).">

    <h1 style="margin:0 0 6px; font-size:23px; color:#2b2b2b;">🛍️ Nuevo pedido {{ $order->number }}</h1>
    <p style="margin:0 0 20px; font-size:14px; color:#5a5a5a;">{{ $channelLabel }} · {{ optional($order->created_at)->format('d/m/Y H:i') }}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f6; border-radius:12px; margin-bottom:22px;">
        <tr><td style="padding:16px 18px; font-size:14px; line-height:1.8; color:#2b2b2b;">
            <strong>Cliente:</strong> {{ $order->customer?->name ?? 'Sin registrar' }}<br>
            @if ($order->customer?->email)<strong>Email:</strong> {{ $order->customer->email }}<br>@endif
            @if ($order->customer?->phone)<strong>Teléfono:</strong> {{ $order->customer->phone }}<br>@endif
            <strong>Pago:</strong> {{ $methodLabel }}
            <span style="display:inline-block; margin-left:6px; padding:2px 8px; border-radius:20px; font-size:11px; background:{{ $order->payment_status === 'aprobado' ? '#e9f7ef' : '#fdf6ec' }}; color:{{ $order->payment_status === 'aprobado' ? '#1e9e57' : '#9a6a16' }};">{{ $order->payment_status === 'aprobado' ? 'Pagado' : 'Pendiente' }}</span><br>
            <strong>Entrega:</strong> {{ $order->shipping_method === 'envio' ? 'Envío a domicilio' : ($order->shipping_method === 'retiro' ? 'Retiro en local' : '—') }}
        </td></tr>
    </table>

    <x-emails.order-summary :order="$order" />

    @if ($order->shipping_method === 'envio' && $order->address)
        <h3 style="margin:24px 0 6px; font-size:13px; text-transform:uppercase; letter-spacing:1px; color:#9a9a9a;">Dirección de envío</h3>
        <p style="margin:0; font-size:14px; line-height:1.6; color:#5a5a5a;">
            {{ $order->address['street'] ?? '' }} {{ $order->address['number'] ?? '' }}
            {{ !empty($order->address['apartment']) ? ', '.$order->address['apartment'] : '' }}<br>
            {{ $order->address['city'] ?? '' }}{{ !empty($order->address['province']) ? ', '.$order->address['province'] : '' }}
            {{ !empty($order->address['zip']) ? '('.$order->address['zip'].')' : '' }}
        </p>
    @endif

    @if ($order->payment_method === 'transferencia')
        <p style="margin:22px 0 0; font-size:13px; line-height:1.6; color:#9a6a16; background:#fdf6ec; border-radius:10px; padding:12px 16px;">
            ⚠️ Pago por transferencia: confirmá el comprobante en el panel para aprobar el pedido.
        </p>
    @elseif ($order->payment_method === 'tarjeta_credito')
        <p style="margin:22px 0 0; font-size:13px; line-height:1.6; color:#9a6a16; background:#fdf6ec; border-radius:10px; padding:12px 16px;">
            ⚠️ Pago con tarjeta de crédito: contactá al cliente por WhatsApp para enviarle el link de pago, y marcá el pedido como pagado en el panel una vez que se acredite.
        </p>
    @endif

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px;">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $frontend }}/admin/pedidos" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Abrir en el panel</a>
            </td></tr>
        </table>
    @endif

</x-emails.layout>

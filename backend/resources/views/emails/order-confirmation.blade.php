@php
    $name = $order->customer?->name ? explode(' ', trim($order->customer->name))[0] : 'Hola';
    $frontend = rtrim(config('app.frontend_url', ''), '/');
@endphp

<x-emails.layout title="Recibimos tu pedido {{ $order->number }}"
                 preheader="Tu pedido {{ $order->number }} fue recibido. Te contamos los próximos pasos.">

    <h1 style="margin:0 0 6px; font-size:24px; color:#2b2b2b;">¡Gracias por tu compra, {{ $name }}!</h1>
    <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#5a5a5a;">
        Recibimos tu pedido <strong style="color:#2b2b2b;">{{ $order->number }}</strong>. Acá está el detalle:
    </p>

    @if ($order->payment_method === 'mercadopago')
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3f6; border-radius:12px; margin-bottom:22px;">
            <tr><td style="padding:16px 18px; font-size:14px; line-height:1.6; color:#821f40;">
                <strong>Pago con MercadoPago.</strong> En cuanto se acredite tu pago vas a recibir la confirmación y empezamos a preparar tu pedido.
            </td></tr>
        </table>
    @elseif ($order->payment_method === 'transferencia')
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3f6; border-radius:12px; margin-bottom:22px;">
            <tr><td style="padding:16px 18px; font-size:14px; line-height:1.7; color:#2b2b2b;">
                <strong style="color:#821f40;">Transferí para confirmar tu pedido</strong><br>
                @if (!empty($transfer['alias']))Alias: <strong>{{ $transfer['alias'] }}</strong><br>@endif
                @if (!empty($transfer['cbu']))CBU: <strong>{{ $transfer['cbu'] }}</strong><br>@endif
                @if (!empty($transfer['bank']))Banco: {{ $transfer['bank'] }}<br>@endif
                @if (!empty($transfer['holder']))Titular: {{ $transfer['holder'] }}<br>@endif
                <span style="display:inline-block; margin-top:8px; color:#5a5a5a;">Enviá el comprobante por WhatsApp y confirmamos tu pedido a la brevedad.</span>
            </td></tr>
        </table>
    @elseif ($order->payment_method === 'tarjeta_credito')
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3f6; border-radius:12px; margin-bottom:22px;">
            <tr><td style="padding:16px 18px; font-size:14px; line-height:1.7; color:#2b2b2b;">
                <strong style="color:#821f40;">Pago con tarjeta de crédito</strong><br>
                <span style="display:inline-block; margin-top:6px; color:#5a5a5a;">
                    Te vamos a contactar por WhatsApp para enviarte el link de pago seguro. Nuestro horario de atención es de <strong>lunes a sábado, de 9 a 21 h</strong>.
                </span>
            </td></tr>
        </table>
    @elseif ($order->status?->value === 'reserva')
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ec; border-radius:12px; margin-bottom:22px;">
            <tr><td style="padding:16px 18px; font-size:14px; line-height:1.6; color:#9a6a16;">
                <strong>Reserva confirmada.</strong> Tu pedido queda reservado para retirar en el local. Te contactamos para coordinar el retiro y el pago en efectivo.
            </td></tr>
        </table>
    @endif

    <x-emails.order-summary :order="$order" />

    @if ($order->shipping_method === 'envio' && $order->address)
        <h3 style="margin:24px 0 6px; font-size:13px; text-transform:uppercase; letter-spacing:1px; color:#9a9a9a;">Envío a</h3>
        <p style="margin:0; font-size:14px; line-height:1.6; color:#5a5a5a;">
            {{ $order->address['street'] ?? '' }} {{ $order->address['number'] ?? '' }}
            {{ !empty($order->address['apartment']) ? ', '.$order->address['apartment'] : '' }}<br>
            {{ $order->address['city'] ?? '' }}{{ !empty($order->address['province']) ? ', '.$order->address['province'] : '' }}
            {{ !empty($order->address['zip']) ? '('.$order->address['zip'].')' : '' }}
        </p>
    @endif

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $frontend }}/cuenta" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Ver mi pedido</a>
            </td></tr>
        </table>
    @endif

</x-emails.layout>

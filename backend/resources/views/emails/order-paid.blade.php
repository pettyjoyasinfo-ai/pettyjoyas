@php
    $name = $order->customer?->name ? explode(' ', trim($order->customer->name))[0] : 'Hola';
    $frontend = rtrim(config('app.frontend_url', ''), '/');
@endphp

<x-emails.layout title="Confirmamos el pago de tu pedido {{ $order->number }}"
                 preheader="¡Tu pago fue acreditado! Ya estamos preparando tu pedido.">

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
        <tr><td align="center" style="width:64px; height:64px; background:#e9f7ef; border-radius:50%; font-size:30px; color:#1e9e57;">&#10004;</td></tr>
    </table>

    <h1 style="margin:0 0 6px; font-size:24px; color:#2b2b2b; text-align:center;">¡Tu pago fue acreditado!</h1>
    <p style="margin:0 0 22px; font-size:15px; line-height:1.6; color:#5a5a5a; text-align:center;">
        {{ $name }}, confirmamos el pago de tu pedido <strong style="color:#2b2b2b;">{{ $order->number }}</strong>.
        Ya lo estamos preparando con mucho cuidado. ✨
    </p>

    <x-emails.order-summary :order="$order" />

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $frontend }}/cuenta" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Seguir mi pedido</a>
            </td></tr>
        </table>
    @endif

</x-emails.layout>

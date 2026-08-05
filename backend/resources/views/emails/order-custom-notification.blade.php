@php
    $name = $order->customer?->name ? explode(' ', trim($order->customer->name))[0] : 'Hola';
    $frontend = rtrim(config('app.frontend_url', ''), '/');
@endphp

<x-emails.layout title="Mensaje sobre tu pedido {{ $order->number }}" preheader="Tenemos un mensaje sobre tu pedido {{ $order->number }}">

    <h1 style="margin:0 0 6px; font-size:23px; color:#2b2b2b;">Hola, {{ $name }} 👋</h1>
    <p style="margin:0 0 18px; font-size:14px; color:#555;">Te dejamos un mensaje sobre tu pedido <strong>{{ $order->number }}</strong>:</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3f6; border-left:4px solid #821f40; border-radius:0 12px 12px 0; margin:0 0 22px;">
        <tr><td style="padding:16px 18px; font-size:15px; line-height:1.7; color:#2b2b2b; white-space:pre-wrap;">{{ $body }}</td></tr>
    </table>

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $frontend }}/cuenta/pedidos" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Ver mi pedido</a>
            </td></tr>
        </table>
    @endif

    <p style="margin-top:28px; font-size:13px; color:#888;">Si tenés dudas, podés responder este correo o escribirnos directamente.</p>

</x-emails.layout>

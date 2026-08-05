@php
    $name = $order->customer?->name ? explode(' ', trim($order->customer->name))[0] : 'Hola';
    $frontend = rtrim(config('app.frontend_url', ''), '/');
    $status = $order->status?->value;

    $map = [
        'preparacion' => ['¡Estamos preparando tu pedido!', 'Tu pedido '.$order->number.' ya está en preparación. Pronto va a estar listo para despacharse.', '#fbf3f6', '#821f40'],
        'enviado'     => ['Tu pedido va en camino 🚚', 'Despachamos tu pedido '.$order->number.'. En breve lo vas a recibir. ¡Gracias por tu paciencia!', '#eef4fb', '#2563a8'],
        'entregado'   => ['¡Tu pedido fue entregado! 💖', 'Esperamos que disfrutes tu compra, '.$name.'. Si te encantó, nos encantaría ver tu reseña.', '#e9f7ef', '#1e9e57'],
        'cancelado'   => ['Tu pedido fue cancelado', 'Cancelamos el pedido '.$order->number.'. Si fue un error o tenés dudas, escribinos y lo resolvemos.', '#fdecec', '#c0392b'],
        'pagado'      => ['Confirmamos tu pago', 'Recibimos el pago de tu pedido '.$order->number.'. ¡Ya lo estamos preparando!', '#e9f7ef', '#1e9e57'],
        'reserva'     => ['Reserva confirmada', 'Tu pedido '.$order->number.' quedó reservado para retirar en el local.', '#fdf6ec', '#9a6a16'],
    ];
    [$headline, $message, $bg, $accent] = $map[$status] ?? ['Actualización de tu pedido', 'El estado de tu pedido '.$order->number.' cambió a "'.$status.'".', '#f4f4f4', '#2b2b2b'];
@endphp

<x-emails.layout title="{{ $headline }} — {{ $order->number }}" preheader="{{ $message }}">

    <h1 style="margin:0 0 6px; font-size:23px; color:#2b2b2b;">{{ $headline }}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{{ $bg }}; border-radius:12px; margin:14px 0 22px;">
        <tr><td style="padding:16px 18px; font-size:14px; line-height:1.6; color:{{ $accent }};">{{ $message }}</td></tr>
    </table>

    <x-emails.order-summary :order="$order" />

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $frontend }}/cuenta" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Ver mi pedido</a>
            </td></tr>
        </table>
    @endif

</x-emails.layout>

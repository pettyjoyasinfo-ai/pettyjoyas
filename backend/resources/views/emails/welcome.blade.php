@php
    $first = $name ? explode(' ', trim($name))[0] : 'Hola';
    $frontend = rtrim(config('app.frontend_url', ''), '/');
    $coupon = $coupon ?? 'BIENVENIDA10';
@endphp

<x-emails.layout title="¡Bienvenida a Petty Joyas!"
                 preheader="Te damos la bienvenida con un {{ $coupon }} de regalo para tu primera compra.">

    <h1 style="margin:0 0 6px; font-size:24px; color:#2b2b2b;">¡Bienvenida a Petty Joyas, {{ $first }}! 💎</h1>
    @if (!empty($customBody))
        <p style="margin:0 0 22px; font-size:15px; line-height:1.6; color:#5a5a5a;">{!! nl2br(e($customBody)) !!}</p>
    @else
        <p style="margin:0 0 22px; font-size:15px; line-height:1.6; color:#5a5a5a;">
            Gracias por sumarte a Petty Joyas. Encontrás relojes, anillos, cadenas, platería y mucho más.
            Para empezar, te dejamos un regalo:
        </p>
    @endif

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td align="center" style="background:#fbf3f6; border:1px dashed #d9a7b8; border-radius:14px; padding:24px;">
            <div style="font-size:12px; text-transform:uppercase; letter-spacing:2px; color:#9a6a86;">10% OFF en tu primera compra</div>
            <div style="font-size:30px; font-weight:700; letter-spacing:3px; color:#821f40; margin-top:8px;">{{ $coupon }}</div>
            <div style="font-size:12px; color:#9a9a9a; margin-top:8px;">Usalo al finalizar tu compra.</div>
        </td></tr>
    </table>

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $frontend }}/tienda" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Ver la colección</a>
            </td></tr>
        </table>
    @endif

</x-emails.layout>

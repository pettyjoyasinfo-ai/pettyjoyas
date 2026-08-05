@php
    $firstName = $name ? explode(' ', trim($name))[0] : 'Hola';
    $frontend  = rtrim(config('app.frontend_url', ''), '/');
@endphp

<x-emails.layout title="Te extrañamos 💎" preheader="Han pasado 90 días desde tu última visita a Petty Joyas. ¡Volvé a brillar!">

    <h1 style="margin:0 0 6px; font-size:23px; color:#2b2b2b;">¡Te extrañamos, {{ $firstName }}! 💎</h1>

    @if ($customBody)
        <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#555;">{!! nl2br(e($customBody)) !!}</p>
    @else
        <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#555;">
            Hace un tiempo que no pasás por Petty Joyas y queremos que sepas que tenemos joyas nuevas esperándote.
            Relojes, anillos, cadenas, platería y todo el estilo que ya conocés.
        </p>
    @endif

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3f6; border:2px dashed #821f40; border-radius:16px; margin:0 0 24px;">
        <tr><td style="padding:28px; text-align:center;">
            <p style="margin:0 0 6px; font-size:13px; color:#821f40; font-weight:600; letter-spacing:2px; text-transform:uppercase;">Tu cupón de regreso</p>
            <p style="margin:0; font-size:34px; font-weight:700; letter-spacing:6px; color:#2b2b2b;">VOLVISTE</p>
            <p style="margin:8px 0 0; font-size:13px; color:#888;">10% de descuento en tu próxima compra</p>
        </td></tr>
    </table>

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $frontend }}/tienda" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
                    Ver lo nuevo →
                </a>
            </td></tr>
        </table>
    @endif

    <p style="font-size:13px; color:#888;">Aplicá el código al momento del checkout. Válido por 30 días.</p>

</x-emails.layout>

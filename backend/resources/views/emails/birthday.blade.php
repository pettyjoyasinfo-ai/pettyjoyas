@php
    $firstName = $name ? explode(' ', trim($name))[0] : 'Hola';
    $frontend  = rtrim(config('app.frontend_url', ''), '/');
@endphp

<x-emails.layout title="¡Feliz cumpleaños! 🎂" preheader="Un regalo de Petty Joyas para tu día especial — cupón CUMPLE25.">

    <h1 style="margin:0 0 6px; font-size:23px; color:#2b2b2b;">¡Feliz cumpleaños, {{ $firstName }}! 🎂</h1>
    @if (!empty($customBody))
        <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#555;">{!! nl2br(e($customBody)) !!}</p>
    @else
        <p style="margin:0 0 20px; font-size:14px; color:#555;">
            Desde Petty Joyas queremos celebrar tu día con un regalo especial para vos.
        </p>
    @endif

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3f6; border:2px dashed #821f40; border-radius:16px; margin:0 0 24px;">
        <tr><td style="padding:28px; text-align:center;">
            <p style="margin:0 0 6px; font-size:13px; color:#821f40; font-weight:600; letter-spacing:2px; text-transform:uppercase;">Tu cupón de cumpleaños</p>
            <p style="margin:0; font-size:34px; font-weight:700; letter-spacing:6px; color:#2b2b2b;">CUMPLE25</p>
            <p style="margin:8px 0 0; font-size:13px; color:#888;">25 % de descuento en tu próxima compra</p>
        </td></tr>
    </table>

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $frontend }}" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
                    Ver la tienda →
                </a>
            </td></tr>
        </table>
    @endif

    <p style="font-size:13px; color:#888;">Aplicá el código al momento del checkout. Válido por tiempo limitado.</p>

</x-emails.layout>

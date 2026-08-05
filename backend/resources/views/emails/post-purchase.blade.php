@php
    $firstName = $name ? explode(' ', trim($name))[0] : 'Hola';
    $frontend  = rtrim(config('app.frontend_url', ''), '/');
@endphp

<x-emails.layout title="Cuidá tu joya ✨" preheader="Consejos de Petty Joyas para mantener tus piezas perfectas.">

    <h1 style="margin:0 0 6px; font-size:23px; color:#2b2b2b;">Gracias por tu compra, {{ $firstName }} ✨</h1>

    @if ($customBody)
        <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#555;">{!! nl2br(e($customBody)) !!}</p>
    @else
        <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#555;">
            Queremos que tu joya brille por siempre. Acá te dejamos algunos consejos para mantenerla en perfecto estado:
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#fbf3f6; border-radius:14px; padding:24px;">
                <p style="margin:0 0 12px; font-size:14px; color:#2b2b2b; font-weight:600;">💧 Evitá el contacto con el agua</p>
                <p style="margin:0 0 16px; font-size:13px; color:#666;">Sacate tus joyas antes de ducharte, nadar o hacer ejercicio.</p>

                <p style="margin:0 0 12px; font-size:14px; color:#2b2b2b; font-weight:600;">🧴 Alejá de perfumes y cremas</p>
                <p style="margin:0 0 16px; font-size:13px; color:#666;">Los químicos pueden alterar el color y el brillo de los metales.</p>

                <p style="margin:0 0 12px; font-size:14px; color:#2b2b2b; font-weight:600;">📦 Guardala en su estuche</p>
                <p style="margin:0; font-size:13px; color:#666;">Protegé tu joya de golpes y roces guardándola separada del resto.</p>
            </td></tr>
        </table>
    @endif

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $frontend }}/tienda" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
                    Ver nueva colección →
                </a>
            </td></tr>
        </table>
    @endif

</x-emails.layout>

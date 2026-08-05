@php
    $firstName = $name ? explode(' ', trim($name))[0] : 'Hola';
    $frontend  = rtrim(config('app.frontend_url', ''), '/');
    $link      = $frontend . '/cuenta/bienvenida?token=' . urlencode($token) . '&email=' . urlencode($email);
@endphp

<x-emails.layout title="Tu invitación a Petty Joyas" preheader="Creá tu cuenta y empezá a disfrutar de tus beneficios exclusivos.">

    <h1 style="margin:0 0 6px; font-size:23px; color:#2b2b2b;">¡Bienvenida, {{ $firstName }}! 🤍</h1>
    <p style="margin:0 0 20px; font-size:14px; color:#555;">
        Fuiste agregada como clienta de Petty Joyas. Creá tu cuenta para ver tu historial de compras y acceder a beneficios exclusivos.
    </p>

    <p style="margin:0 0 8px; font-size:13px; color:#888;">Este link es válido por <strong>7 días</strong>.</p>

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $link }}" style="display:inline-block; padding:14px 32px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
                    Crear mi cuenta →
                </a>
            </td></tr>
        </table>
    @endif

    <p style="font-size:12px; color:#aaa; word-break:break-all;">
        Si el botón no funciona, copiá este link en tu navegador:<br>
        <a href="{{ $link }}" style="color:#821f40;">{{ $link }}</a>
    </p>

    <p style="margin-top:24px; font-size:13px; color:#888;">Si no esperabas este correo, podés ignorarlo sin problema.</p>

</x-emails.layout>

@php
    $first   = $name ? explode(' ', trim($name))[0] : 'Hola';
    $roleLabel = $role === 'admin' ? 'Administrador' : 'Vendedor';
    $adminUrl  = rtrim(config('app.frontend_url', ''), '/') . '/admin';
@endphp

<x-emails.layout title="Bienvenido al panel de Petty Joyas"
                 preheader="Tu cuenta de {{ $roleLabel }} ya está lista. Accedé al panel con los datos adjuntos.">

    <h1 style="margin:0 0 6px; font-size:24px; color:#2b2b2b;">¡Bienvenido/a, {{ $first }}! 🤍</h1>
    <p style="margin:0 0 22px; font-size:15px; line-height:1.6; color:#5a5a5a;">
        Tu cuenta de <strong>{{ $roleLabel }}</strong> en Petty Joyas fue creada.
        A continuación están tus datos de acceso al panel de administración:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr><td style="background:#fbf3f6; border:1px solid #e8c9d6; border-radius:14px; padding:22px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="font-size:13px; color:#9a6a86; padding-bottom:8px; width:130px;">Email</td>
                    <td style="font-size:14px; font-weight:600; color:#2b2b2b; padding-bottom:8px;">{{ $email }}</td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#9a6a86; padding-bottom:8px;">Contraseña</td>
                    <td style="font-size:14px; font-weight:600; font-family:monospace; color:#821f40; padding-bottom:8px;">{{ $password }}</td>
                </tr>
                <tr>
                    <td style="font-size:13px; color:#9a6a86;">Rol</td>
                    <td style="font-size:14px; color:#2b2b2b;">{{ $roleLabel }}</td>
                </tr>
            </table>
        </td></tr>
    </table>

    <p style="margin:0 0 20px; font-size:13px; line-height:1.6; color:#9a9a9a;">
        Te recomendamos cambiar tu contraseña la primera vez que ingreses, desde la sección <em>Mi perfil</em> del panel.
    </p>

    @if ($adminUrl)
        <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $adminUrl }}" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">Ir al panel</a>
            </td></tr>
        </table>
    @endif

</x-emails.layout>

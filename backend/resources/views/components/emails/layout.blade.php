@props([
    'title' => 'Petty Joyas',
    'preheader' => 'Petty Joyas — Relojes, Anillos, Cadenas y Platería',
])
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>{{ $title }}</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f5f3f0; }
        a { color: #821f40; }
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .px { padding-left: 24px !important; padding-right: 24px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f5f3f0; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#2b2b2b;">
    {{-- Preheader: texto de vista previa en la bandeja de entrada --}}
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:#f5f3f0;">{{ $preheader }}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f3f0;">
        <tr>
            <td align="center" style="padding: 32px 12px;">
                <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06);">

                    {{-- Encabezado de marca --}}
                    <tr>
                        <td align="center" style="background-color:#821f40; padding: 28px 24px;">
                            <div style="font-size:22px; letter-spacing:6px; color:#ffffff; font-weight:600;">PETTY</div>
                            <div style="font-size:11px; letter-spacing:10px; color:#e7c9d3; margin-top:4px;">JOYAS</div>
                        </td>
                    </tr>

                    {{-- Contenido --}}
                    <tr>
                        <td class="px" style="padding: 36px 40px;">
                            {{ $slot }}
                        </td>
                    </tr>

                    {{-- Pie --}}
                    <tr>
                        <td style="background-color:#2b2b2b; padding: 26px 40px; color:#cfcfcf; font-size:12px; line-height:1.7;">
                            <div style="color:#ffffff; font-weight:600; letter-spacing:3px; font-size:13px;">PETTY JOYAS</div>
                            <div style="margin-top:8px;">Relojes · Anillos · Cadenas · Platería y más.</div>
                            <div style="margin-top:10px;">
                                <a href="mailto:pettyjoyas1@outlook.com" style="color:#e7c9d3; text-decoration:none;">pettyjoyas1@outlook.com</a>
                                &nbsp;·&nbsp;
                                <a href="https://www.instagram.com/pettyjoyas/" style="color:#e7c9d3; text-decoration:none;">@pettyjoyas</a>
                            </div>
                            <div style="margin-top:14px; color:#8a8a8a;">
                                Recibís este correo porque realizaste una compra o tenés una cuenta en Petty Joyas.
                            </div>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>

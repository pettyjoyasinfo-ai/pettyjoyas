@php
    $firstName = $name ? explode(' ', trim($name))[0] : 'Hola';
    $frontend  = rtrim(config('app.frontend_url', ''), '/');
@endphp

<x-emails.layout title="¡Tu carrito te espera! 💛" preheader="Dejaste algunos productos en tu carrito de Petty Joyas.">

    <h1 style="margin:0 0 6px; font-size:23px; color:#2b2b2b;">¡Hola, {{ $firstName }}! 💛</h1>

    @if ($customBody)
        <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#555;">{!! nl2br(e($customBody)) !!}</p>
    @else
        <p style="margin:0 0 20px; font-size:14px; line-height:1.6; color:#555;">
            Notamos que dejaste algunos productos en tu carrito. ¡Todavía están disponibles para vos!
        </p>
    @endif

    @if (count($items) > 0)
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px; border:1px solid #f0e8ec; border-radius:14px; overflow:hidden;">
            @foreach ($items as $item)
                <tr style="border-bottom:1px solid #f0e8ec;">
                    <td style="padding:12px 16px;">
                        <p style="margin:0; font-size:14px; font-weight:600; color:#2b2b2b;">{{ $item['name'] }}</p>
                        @if (!empty($item['variant']))
                            <p style="margin:2px 0 0; font-size:12px; color:#888;">{{ $item['variant'] }}</p>
                        @endif
                    </td>
                    <td style="padding:12px 16px; text-align:right; white-space:nowrap;">
                        <p style="margin:0; font-size:13px; color:#555;">x{{ $item['quantity'] }}</p>
                    </td>
                </tr>
            @endforeach
        </table>
    @endif

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $frontend }}/carrito" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
                    Ver mi carrito →
                </a>
            </td></tr>
        </table>
    @endif

    <p style="font-size:13px; color:#888;">Si ya realizaste tu compra, podés ignorar este mensaje.</p>

</x-emails.layout>

@php
    use App\Enums\CouponType;
    $firstName = $recipientName ? explode(' ', trim($recipientName))[0] : 'Hola';
    $discountLabel = $coupon->type === CouponType::Percent
        ? "{$coupon->value}% OFF"
        : '$' . number_format($coupon->value, 0, ',', '.') . ' OFF';
    $frontend = rtrim(config('app.frontend_url', ''), '/');
@endphp

<x-emails.layout title="Tu cupón exclusivo de Petty Joyas" preheader="Código de descuento especial para vos — {{ $coupon->code }}">

    <h1 style="margin:0 0 6px; font-size:23px; color:#2b2b2b;">¡Tenés un cupón exclusivo! 🎁</h1>
    <p style="margin:0 0 20px; font-size:14px; color:#555;">
        El equipo de Petty Joyas quiere ofrecerte este descuento especial, {{ $firstName }}.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3f6; border:2px dashed #821f40; border-radius:16px; margin:0 0 24px;">
        <tr><td style="padding:28px; text-align:center;">
            <p style="margin:0 0 6px; font-size:12px; color:#821f40; font-weight:600; letter-spacing:2px; text-transform:uppercase;">Tu código de descuento</p>
            <p style="margin:0; font-size:32px; font-weight:700; letter-spacing:5px; color:#2b2b2b;">{{ $coupon->code }}</p>
            <p style="margin:10px 0 0; font-size:20px; font-weight:600; color:#821f40;">{{ $discountLabel }}</p>
            @if ($coupon->description)
                <p style="margin:8px 0 0; font-size:13px; color:#888;">{{ $coupon->description }}</p>
            @endif
            @if ($coupon->min_subtotal)
                <p style="margin:6px 0 0; font-size:12px; color:#aaa;">Mínimo de compra: ${{ number_format($coupon->min_subtotal, 0, ',', '.') }}</p>
            @endif
            @if ($coupon->expires_at)
                <p style="margin:6px 0 0; font-size:12px; color:#aaa;">Válido hasta el {{ $coupon->expires_at->format('d/m/Y') }}</p>
            @endif
        </td></tr>
    </table>

    @if ($frontend)
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="border-radius:10px; background:#821f40;">
                <a href="{{ $frontend }}/tienda" style="display:inline-block; padding:13px 28px; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none;">
                    Ir a la tienda →
                </a>
            </td></tr>
        </table>
    @endif

    <p style="font-size:13px; color:#888;">Usá el código al momento del checkout. Es de uso personal.</p>

</x-emails.layout>

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /** Configuración pública del sitio (barra superior, beneficios, etc.). */
    public function index()
    {
        return response()->json(SiteSetting::allWithDefaults());
    }

    /**
     * Upsert de una o varias claves de configuración.
     * Body: { "announcement": {...}, "features": {...} }
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'announcement'         => ['sometimes', 'array'],
            'announcement.enabled' => ['sometimes', 'boolean'],
            'announcement.items'   => ['sometimes', 'array'],
            'announcement.items.*.icon' => ['nullable', 'string', 'max:40'],
            'announcement.items.*.text' => ['required', 'string', 'max:160'],

            'features'               => ['sometimes', 'array'],
            'features.items'         => ['sometimes', 'array'],
            'features.items.*.icon'  => ['nullable', 'string', 'max:40'],
            'features.items.*.title' => ['required', 'string', 'max:80'],
            'features.items.*.text'  => ['nullable', 'string', 'max:120'],

            'hero'                  => ['sometimes', 'array'],
            'hero.slides'           => ['sometimes', 'array'],
            'hero.slides.*.id'      => ['nullable', 'string', 'max:40'],
            'hero.slides.*.eyebrow' => ['nullable', 'string', 'max:80'],
            'hero.slides.*.title'   => ['required', 'string', 'max:120'],
            'hero.slides.*.image'   => ['required', 'string', 'max:500'],
            'hero.slides.*.href'    => ['nullable', 'string', 'max:200'],
            'hero.slides.*.enabled' => ['nullable', 'boolean'],

            'payment'                             => ['sometimes', 'array'],
            'payment.mercadopago_enabled'         => ['sometimes', 'boolean'],
            'payment.transferencia_enabled'       => ['sometimes', 'boolean'],
            'payment.descuento_transferencia'     => ['sometimes', 'integer', 'min:0', 'max:100'],

            'shipping'                      => ['sometimes', 'array'],
            'shipping.domicilio_enabled'    => ['sometimes', 'boolean'],
            'shipping.retiro_enabled'       => ['sometimes', 'boolean'],
            'shipping.costo_estandar'       => ['sometimes', 'integer', 'min:0'],
            'shipping.gratis_desde'         => ['sometimes', 'integer', 'min:0'],
            'shipping.retiro_direccion'     => ['sometimes', 'nullable', 'string', 'max:200'],

            'badges'            => ['sometimes', 'array'],
            'badges.nuevo'      => ['sometimes', 'boolean'],
            'badges.oferta'     => ['sometimes', 'boolean'],
            'badges.destacado'  => ['sometimes', 'boolean'],
            'badges.agotado'    => ['sometimes', 'boolean'],

            'banners'                  => ['sometimes', 'array'],
            'banners.items'            => ['sometimes', 'array'],
            'banners.items.*.id'       => ['nullable', 'string', 'max:40'],
            'banners.items.*.eyebrow'  => ['nullable', 'string', 'max:80'],
            'banners.items.*.title'    => ['required', 'string', 'max:120'],
            'banners.items.*.image'    => ['nullable', 'string', 'max:500'],
            'banners.items.*.href'     => ['nullable', 'string', 'max:200'],
            'banners.items.*.cta'      => ['nullable', 'boolean'],
            'banners.items.*.slot'     => ['nullable', 'string', 'in:principal,chico-1,chico-2,alto'],

            'nosotros'                   => ['sometimes', 'array'],
            'nosotros.eyebrow'           => ['nullable', 'string', 'max:80'],
            'nosotros.title'             => ['nullable', 'string', 'max:120'],
            'nosotros.paragraphs'        => ['nullable', 'array'],
            'nosotros.paragraphs.*'      => ['nullable', 'string', 'max:600'],
            'nosotros.image'             => ['nullable', 'string', 'max:500'],

            'about'                   => ['sometimes', 'array'],
            'about.eyebrow'           => ['nullable', 'string', 'max:80'],
            'about.title'             => ['nullable', 'string', 'max:120'],
            'about.paragraphs'        => ['nullable', 'array'],
            'about.paragraphs.*'      => ['nullable', 'string', 'max:600'],
            'about.image1'            => ['nullable', 'string', 'max:500'],
            'about.image2'            => ['nullable', 'string', 'max:500'],
            'about.ctaText'           => ['nullable', 'string', 'max:80'],
            'about.ctaHref'           => ['nullable', 'string', 'max:200'],

            'collection'              => ['sometimes', 'array'],
            'collection.sideText'     => ['nullable', 'string', 'max:100'],
            'collection.eyebrow'      => ['nullable', 'string', 'max:80'],
            'collection.title'        => ['nullable', 'string', 'max:120'],
            'collection.image'        => ['nullable', 'string', 'max:500'],
            'collection.smallImage'   => ['nullable', 'string', 'max:500'],
            'collection.ctaText'      => ['nullable', 'string', 'max:80'],
            'collection.ctaHref'      => ['nullable', 'string', 'max:200'],

            'brands'              => ['sometimes', 'array'],
            'brands.heading'      => ['nullable', 'string', 'max:120'],
            'brands.items'        => ['sometimes', 'array'],
            'brands.items.*.id'   => ['nullable', 'string', 'max:40'],
            'brands.items.*.name' => ['required', 'string', 'max:80'],

            'instagram'         => ['sometimes', 'array'],
            'instagram.urls'    => ['sometimes', 'array', 'max:6'],
            'instagram.urls.*'  => ['nullable', 'string', 'max:500', 'regex:/^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[^\s]+$/i'],
        ]);

        foreach ($data as $key => $value) {
            SiteSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return response()->json(SiteSetting::allWithDefaults());
    }
}

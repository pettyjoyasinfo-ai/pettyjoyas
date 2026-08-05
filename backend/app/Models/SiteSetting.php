<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'array',
    ];

    /** Valores por defecto: lo que se ve hoy en la home si no hay nada guardado. */
    public static function defaults(): array
    {
        return [
            // Barra superior (fondo negro, arriba del header).
            'announcement' => [
                'enabled' => true,
                'items' => [
                    ['icon' => 'Truck', 'text' => 'Envío gratis desde $80.000'],
                    ['icon' => 'Sparkles', 'text' => '3 cuotas sin interés · Envíos a todo el país'],
                ],
            ],
            // Barra de beneficios (debajo del hero).
            'features' => [
                'items' => [
                    ['icon' => 'Truck', 'title' => 'Envío a todo el país', 'text' => 'Gratis desde $80.000'],
                    ['icon' => 'ShieldCheck', 'title' => 'Compra protegida', 'text' => 'Pago seguro con MercadoPago'],
                    ['icon' => 'RefreshCcw', 'title' => 'Cambios sin vueltas', 'text' => '30 días para cambios'],
                    ['icon' => 'Gem', 'title' => 'Garantía de por vida', 'text' => 'En el armado de cada pieza'],
                ],
            ],
            // Métodos de pago.
            'payment' => [
                'mercadopago_enabled'      => true,
                'transferencia_enabled'    => true,
                'descuento_transferencia'  => 10,
            ],
            // Opciones de envío (importes en centavos para coincidir con el resto del sistema).
            'shipping' => [
                'domicilio_enabled' => true,
                'retiro_enabled'    => true,
                'costo_estandar'    => 650000,
                'gratis_desde'      => 8000000,
                'retiro_direccion'  => 'Av. Victoria Aguirre 262, N3370 Puerto Iguazú, Misiones',
            ],
            // Visibilidad de badges en las tarjetas de producto.
            'badges' => [
                'nuevo'     => true,
                'oferta'    => true,
                'destacado' => true,
                'agotado'   => true,
            ],
            // Banners de la home.
            'banners' => [
                'items' => [
                    ['id' => 'ban-1', 'eyebrow' => 'Colección',      'title' => 'Anillos Art Déco 2024',           'image' => '/assets/img/banner/4/banner-1.jpg', 'href' => '/tienda?categoria=anillos',    'cta' => true,  'slot' => 'principal'],
                    ['id' => 'ban-2', 'eyebrow' => 'Tendencia',       'title' => 'Conjuntos coordinados',           'image' => '/assets/img/banner/4/banner-2.jpg', 'href' => '/tienda?categoria=conjuntos', 'cta' => false, 'slot' => 'chico-1'],
                    ['id' => 'ban-3', 'eyebrow' => 'Recién llegado',  'title' => 'Joyas en oro',                    'image' => '/assets/img/banner/4/banner-3.jpg', 'href' => '/tienda?material=oro',        'cta' => false, 'slot' => 'chico-2'],
                    ['id' => 'ban-4', 'eyebrow' => 'Colección',       'title' => 'Anillos de oro con diamantes',    'image' => '/assets/img/banner/4/banner-4.jpg', 'href' => '/tienda?categoria=anillos',    'cta' => true,  'slot' => 'alto'],
                ],
            ],
            // Página Nosotros (/nosotros).
            'nosotros' => [
                'eyebrow'    => 'Nuestra historia',
                'title'      => 'Joyas que cuentan historias',
                'paragraphs' => [
                    'Petty Joyas es una joyería con base en Puerto Iguazú y más de 30 años de trayectoria. Creemos que una joya no es solo un accesorio: es un recuerdo, un regalo, una forma de expresar quién sos.',
                    'Seleccionamos piezas de calidad en oro y plata para que siempre encuentres algo que te represente, ya sea para vos o para regalar.',
                ],
                'image' => '/assets/img/about/about-1.jpg',
            ],
            // Sección Nosotros (home).
            'about' => [
                'eyebrow'    => 'Colección Unity',
                'title'      => 'Ediciones limitadas, hechas para durar',
                'paragraphs' => [
                    'Seleccionamos cada pieza combinando materiales nobles y buena terminación. Joyas pensadas para acompañarte en los momentos que importan —y para regalar lo que no se olvida.',
                    'Anillos, collares, aros, pulseras y conjuntos: todo el universo de la joyería, con la calidad y el detalle que nos define.',
                ],
                'image1'  => '/assets/img/about/about-1.jpg',
                'image2'  => '/assets/img/about/about-2.jpg',
                'ctaText' => 'Contactanos',
                'ctaHref' => '/contacto',
            ],
            // Sección Colección destacada.
            'collection' => [
                'sideText'   => 'Con nuevo look y nueva colección',
                'eyebrow'    => 'Armá tu propio set',
                'title'      => 'Nuestras mejores joyas',
                'image'      => '/assets/img/product/collection/4/collection-1.jpg',
                'smallImage' => '/assets/img/product/collection/4/collection-sm-1.jpg',
                'ctaText'    => 'Ver esta colección',
                'ctaHref'    => '/tienda?categoria=conjuntos',
            ],
            // Carrusel de marcas.
            'brands' => [
                'heading' => 'Trabajamos con las mejores marcas',
                'items' => [
                    ['id' => 'b-casio',   'name' => 'CASIO'],
                    ['id' => 'b-rolex',   'name' => 'ROLEX'],
                    ['id' => 'b-citizen', 'name' => 'CITIZEN'],
                    ['id' => 'b-seiko',   'name' => 'SEIKO'],
                    ['id' => 'b-tissot',  'name' => 'TISSOT'],
                    ['id' => 'b-swatch',  'name' => 'SWATCH'],
                    ['id' => 'b-festina', 'name' => 'FESTINA'],
                    ['id' => 'b-pandora', 'name' => 'PANDORA'],
                ],
            ],
            // Galería de Instagram (hasta 6 links de posts, en el orden elegido).
            // Se renderizan con el embed oficial de Instagram (sin scraping).
            'instagram' => [
                'urls' => [],
            ],
            // Slides del hero principal.
            'hero' => [
                'slides' => [
                    ['id' => 'hero-1', 'eyebrow' => 'El original', 'title' => 'Brillá siempre',   'image' => '/assets/img/slider/4/slider-1.png', 'href' => '/tienda',               'enabled' => true],
                    ['id' => 'hero-2', 'eyebrow' => 'El original', 'title' => 'Recién llegadas',  'image' => '/assets/img/slider/4/slider-2.png', 'href' => '/tienda?orden=nuevos',  'enabled' => true],
                    ['id' => 'hero-3', 'eyebrow' => 'El original', 'title' => 'Bañadas en oro',   'image' => '/assets/img/slider/4/slider-3.png', 'href' => '/tienda?material=oro',  'enabled' => true],
                    ['id' => 'hero-4', 'eyebrow' => 'El original', 'title' => 'Formas únicas',    'image' => '/assets/img/slider/4/slider-4.png', 'href' => '/tienda?oferta=1',      'enabled' => true],
                ],
            ],
        ];
    }

    /** Mapa key => value con defaults aplicados para las claves faltantes. */
    public static function allWithDefaults(): array
    {
        $stored = static::query()->pluck('value', 'key')->toArray();

        return array_merge(static::defaults(), $stored);
    }
}

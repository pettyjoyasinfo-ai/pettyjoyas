<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $children = [
            'anillos' => [
                ['slug' => 'anillos-solitarios',   'name' => 'Solitarios'],
                ['slug' => 'anillos-compromiso',    'name' => 'Compromiso'],
                ['slug' => 'anillos-eternity',      'name' => 'Eternity'],
                ['slug' => 'alianzas',              'name' => 'Alianzas'],
            ],
            'collares' => [
                ['slug' => 'collares-cadenas',      'name' => 'Cadenas'],
                ['slug' => 'chokers',               'name' => 'Chokers'],
                ['slug' => 'dijes',                 'name' => 'Dijes'],
                ['slug' => 'gargantillas',          'name' => 'Gargantillas'],
            ],
            'aros' => [
                ['slug' => 'argollas',              'name' => 'Argollas'],
                ['slug' => 'aros-pendientes',       'name' => 'Pendientes'],
                ['slug' => 'aros-trepadores',       'name' => 'Trepadores'],
                ['slug' => 'aros-con-perla',        'name' => 'Con perla'],
            ],
            'pulseras' => [
                ['slug' => 'pulseras-esclavas',     'name' => 'Esclavas'],
                ['slug' => 'pulseras-tennis',       'name' => 'Tennis'],
                ['slug' => 'pulseras-rigidas',      'name' => 'Rígidas'],
            ],
            'conjuntos' => [
                ['slug' => 'conjuntos-nupciales',   'name' => 'Nupciales'],
                ['slug' => 'conjuntos-diarios',     'name' => 'Diarios'],
            ],
            'relojes' => [
                ['slug' => 'relojes-clasicos',      'name' => 'Clásicos'],
                ['slug' => 'relojes-deportivos',    'name' => 'Deportivos'],
            ],
        ];

        foreach ($children as $parentSlug => $cats) {
            $parent = Category::where('slug', $parentSlug)->first();
            if (! $parent) {
                continue;
            }
            foreach ($cats as $i => $c) {
                Category::updateOrCreate(
                    ['slug' => $c['slug']],
                    ['name' => $c['name'], 'parent_id' => $parent->id, 'position' => $i, 'featured' => false]
                );
            }
        }
    }
}

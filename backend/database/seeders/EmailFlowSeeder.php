<?php

namespace Database\Seeders;

use App\Models\EmailFlow;
use Illuminate\Database\Seeder;

class EmailFlowSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['name' => 'Bienvenida',         'trigger' => 'welcome',        'subject' => '¡Bienvenida a Petty Joyas! Tu 10% de regalo 💎'],
            ['name' => 'Carrito abandonado', 'trigger' => 'abandoned_cart', 'subject' => 'Olvidaste algo en tu carrito 💛'],
            ['name' => 'Cumpleaños',         'trigger' => 'birthday',       'subject' => '¡Feliz cumpleaños! 🎂 Un regalo de Petty Joyas para vos'],
            ['name' => 'Post-compra',        'trigger' => 'post_purchase',  'subject' => 'Consejos para cuidar tu joya ✨'],
            ['name' => 'Reactivación',       'trigger' => 'reactivation',   'subject' => 'Te extrañamos en Petty Joyas 💎'],
        ];

        foreach ($rows as $row) {
            EmailFlow::firstOrCreate(
                ['trigger' => $row['trigger']],
                [
                    'name'       => $row['name'],
                    'subject'    => $row['subject'],
                    'template'   => null,
                    'active'     => true,
                    'sent_count' => 0,
                ]
            );
        }
    }
}

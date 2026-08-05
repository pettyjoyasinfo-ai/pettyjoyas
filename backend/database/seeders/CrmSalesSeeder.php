<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\EmailFlow;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CrmSalesSeeder extends Seeder
{
    public function run(): void
    {
        // ── Cupones ──
        $coupons = [
            ['code' => 'BIENVENIDA10', 'type' => 'percent', 'value' => 10, 'description' => '10% primera compra', 'used_count' => 184],
            ['code' => 'PETTY15', 'type' => 'percent', 'value' => 15, 'min_subtotal' => 120000, 'description' => '15% desde $120.000', 'used_count' => 52, 'max_uses' => 100],
            ['code' => 'ENVIOGRATIS', 'type' => 'fixed', 'value' => 6500, 'min_subtotal' => 50000, 'description' => 'Descuento de envío', 'used_count' => 210],
        ];
        foreach ($coupons as $c) {
            Coupon::updateOrCreate(['code' => $c['code']], $c);
        }

        // ── Flujos de email ──
        // trigger = clave de máquina usada por los comandos Artisan para identificar cada flujo.
        $flows = [
            ['name' => 'Bienvenida + cupón 10%',        'trigger' => 'welcome',        'subject' => '¡Bienvenida a Petty Joyas! Tu 10% de regalo 💎',                  'sent_count' => 0, 'active' => true],
            ['name' => 'Carrito abandonado',             'trigger' => 'abandoned_cart', 'subject' => 'Olvidaste algo en tu carrito 💛',                                  'sent_count' => 0, 'active' => true],
            ['name' => 'Cumpleaños 25% off',             'trigger' => 'birthday',       'subject' => '¡Feliz cumpleaños! 🎂 Un regalo de Petty Joyas para vos',          'sent_count' => 0, 'active' => true],
            ['name' => 'Post-compra: cuidado de tu joya', 'trigger' => 'post_purchase', 'subject' => 'Consejos para cuidar tu joya ✨',                                  'sent_count' => 0, 'active' => true],
            ['name' => 'Reactivación 90 días',           'trigger' => 'reactivation',   'subject' => 'Te extrañamos en Petty Joyas 💎',                                  'sent_count' => 0, 'active' => false],
        ];
        foreach ($flows as $f) {
            EmailFlow::updateOrCreate(['trigger' => $f['trigger']], $f);
        }

        // ── Descuentos / promos ──
        $arosId = Category::where('slug', 'aros')->value('id');
        Discount::updateOrCreate(['name' => '20% OFF en Aros'], [
            'type' => 'percent', 'value' => 20, 'scope' => 'category', 'category_id' => $arosId,
            'ends_at' => now()->addDays(15), 'active' => true,
        ]);
        Discount::updateOrCreate(['name' => 'Semana de la Joya · 10%'], [
            'type' => 'percent', 'value' => 10, 'scope' => 'all',
            'ends_at' => now()->addDays(7), 'active' => true,
        ]);
        Discount::updateOrCreate(['name' => 'Link VIP · 15% extra'], [
            'type' => 'percent', 'value' => 15, 'scope' => 'all',
            'active' => true, 'requires_token' => true, 'token' => 'vip15',
        ]);

        // ── Clientes ──
        $customers = collect([
            ['name' => 'María Pérez', 'email' => 'maria.perez@gmail.com', 'phone' => '+54 9 11 5123-4567', 'segment' => 'vip', 'vip' => true, 'birthday' => '1992-07-12', 'tags' => ['frecuente'], 'notes' => 'Talle de anillo 16. Le encantan las perlas.'],
            ['name' => 'Lucía Martínez', 'email' => 'lu.martinez@hotmail.com', 'phone' => '+54 9 11 6234-5678', 'segment' => 'recurrente', 'birthday' => '1990-09-03'],
            ['name' => 'Sofía Díaz', 'email' => 'sofidiaz@gmail.com', 'phone' => '+54 9 351 412-3456', 'segment' => 'nuevo', 'birthday' => '1998-06-21', 'tags' => ['influencer']],
            ['name' => 'Carla Gómez', 'email' => 'carla.g@yahoo.com', 'phone' => '+54 9 11 7345-6789', 'segment' => 'recurrente', 'birthday' => '1988-06-28', 'tags' => ['mayorista']],
            ['name' => 'Julieta Ríos', 'email' => 'julirios@gmail.com', 'phone' => '+54 9 261 523-4567', 'segment' => 'inactivo', 'birthday' => '1995-11-15'],
        ])->map(fn ($c) => Customer::updateOrCreate(['email' => $c['email']], $c));

        // ── Pedidos repartidos en el tiempo (para reportes comparativos) ──
        $products = Product::all();
        $methods = ['mercadopago', 'transferencia', 'efectivo'];
        $channels = ['online', 'online', 'online', 'local'];
        $statuses = ['entregado', 'entregado', 'enviado', 'preparacion', 'pagado'];

        for ($i = 1; $i <= 24; $i++) {
            $product = $products->random();
            $qty = random_int(1, 2);
            $subtotal = $product->price * $qty;
            $discount = $i % 4 === 0 ? (int) round($subtotal * 0.1) : 0;
            $channel = $channels[array_rand($channels)];
            $shipping = $channel === 'online' && $subtotal < 80000 ? 6500 : 0;
            // Mayoría reciente (para poblar dashboard/reportes), algunos más viejos.
            $date = now()->subDays(random_int(0, $i <= 16 ? 75 : 330))->setTime(random_int(9, 20), random_int(0, 59));

            $order = Order::create([
                'number' => 'PJ-'.str_pad((string) (2000 + $i), 6, '0', STR_PAD_LEFT),
                'channel' => $channel,
                'customer_id' => $customers->random()->id,
                'status' => $statuses[array_rand($statuses)],
                'payment_method' => $methods[array_rand($methods)],
                'payment_status' => 'aprobado',
                'shipping_method' => $channel === 'online' ? 'envio' : null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping_cost' => $shipping,
                'total' => $subtotal - $discount + $shipping,
                'coupon_code' => $discount ? 'BIENVENIDA10' : null,
                'created_at' => $date,
                'updated_at' => $date,
            ]);

            $order->items()->create([
                'product_id' => $product->id,
                'name' => $product->name,
                'unit_price' => $product->price,
                'quantity' => $qty,
            ]);
        }
    }
}

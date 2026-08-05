<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\SaleChannel;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $clientas = [
            ['name' => 'Valentina Torres',    'email' => 'valentina.torres@gmail.com'],
            ['name' => 'Camila Rodríguez',    'email' => 'camila.rodriguez@outlook.com'],
            ['name' => 'Florencia Giménez',   'email' => 'florencia.gimenez@gmail.com'],
            ['name' => 'Romina Sosa',         'email' => 'romina.sosa@yahoo.com'],
            ['name' => 'Agustina Fernández',  'email' => 'agustina.fernandez@gmail.com'],
            ['name' => 'Natalia Vega',        'email' => 'natalia.vega@gmail.com'],
            ['name' => 'Luciana Pereyra',     'email' => 'luci.pereyra@gmail.com'],
            ['name' => 'Micaela Herrera',     'email' => 'mica.herrera@hotmail.com'],
        ];

        $users = collect($clientas)->map(fn ($c) => User::updateOrCreate(
            ['email' => $c['email']],
            ['name' => $c['name'], 'password' => Hash::make('password'), 'role' => UserRole::Cliente]
        ));

        // [slug, rating, reseña, autora_idx, fecha_días_atras]
        $reviews = [
            ['conjunto-novia-aurora', 5, 'Compré el conjunto para el casamiento de mi hermana y quedó IMPRESIONANTE. La calidad es increíble, el baño duró perfecto durante toda la noche de fiesta. El packaging también es muy lindo para regalo. 100% recomendado.', 0, 20],
            ['conjunto-novia-aurora', 5, 'Lo usé para mi civil y recibí mil piropos. La plata es muy buena, no se oscureció en todo el día. Lo compraría de nuevo sin dudarlo.', 1, 8],
            ['anillo-solitario-aura', 5, 'Hermoso anillo, muy delicado. Llegó bien embalado y antes del tiempo estimado. Lo uso todos los días hace dos meses y sigue como nuevo, sin decolorar ni nada. Super contenta con mi compra!', 2, 65],
            ['anillo-solitario-aura', 4, 'Lindo diseño y buena calidad. El único detalle es que me quedó un poquito grande en el talle 16, quizás la próxima pido el 14. Pero el producto en sí está muy bien.', 3, 30],
            ['collar-gota-celeste', 5, 'Lo compré para mi cumpleaños y me lo regalé jaja. Hermoso, la piedra tiene un color divino. Varios me preguntaron dónde lo conseguí. Muy buena relación calidad-precio.', 4, 45],
            ['collar-gota-celeste', 5, 'Regalé uno a mi mamá y quedó enamorada. Ya me está pidiendo los aros a juego. La cajita en la que viene también es muy linda, ideal para regalo.', 5, 15],
            ['pulsera-tennis-brillante', 5, 'Uffff preciosa, no me la saco nunca. Brilla un montón y parece mucho más costosa de lo que es. Excelente atención también cuando pregunté por el talle antes de comprarlo.', 6, 55],
            ['aros-argolla-luna', 5, 'Los aros son exactamente como en la foto, tamaño perfecto. Material muy bueno, no me irritó en ningún momento y soy sensible. Definitivamente vuelvo a comprar.', 7, 40],
            ['aros-argolla-luna', 4, 'Muy lindos! Llegaron rápido y bien embalados. Los uso casi todos los días. Un detallazo que la argolla cierre súper bien, no se me cayó ni una vez.', 0, 12],
            ['collar-iniciales-lettre', 5, 'Regalé el collar con inicial a mi sobrina para su cumple de 15 y fue el regalo más elogiado de la noche. Muy bonito y delicado, ella está re feliz.', 1, 25],
            ['anillo-eternity-pave', 5, 'Este anillo es una joya (literalmente). Lo compré para mi aniversario y mi pareja quedó sin palabras. La calidad es excepcional para el precio. Ya quiero comprar más cosas de la marca.', 2, 90],
            ['conjunto-perla-margot', 5, 'El conjunto de perlas es simplemente perfecto. Muy elegante y versátil, lo usé tanto para el trabajo como para una cena formal. Entrega rapidísima y el embalaje es una preciosura.', 3, 50],
            ['pulsera-esclava-vienna', 5, 'Compré la versión dorada y es espectacular. No pierda color, no da alergia, y queda preciosa. Ya la recomendé a 3 amigas.', 4, 35],
            ['aros-perla-clasica', 4, 'Clásicos y elegantes. Calidad muy buena para el precio. Los uso para el trabajo y dan un toque súper prolijo al look. Volveré a comprar sin dudas.', 5, 18],
            ['collar-dije-corazon', 5, 'Me lo regalé el día de los enamorados y se convirtió en mi favorito. El dije es pequeño y delicado, justo como me gustaba. Muy buena compra!', 6, 60],
            ['reloj-minimal-petite', 5, 'Elegante, liviano, y la correa es cómoda. El color dorado es muy bonito y no es ordinario. Vale cada peso. Lleva 3 meses en mi muñeca y funciona perfecto.', 7, 75],
        ];

        foreach ($reviews as [$slug, $rating, $body, $userIdx, $daysAgo]) {
            $product = Product::where('slug', $slug)->first();
            if (! $product) {
                continue;
            }

            $user = $users[$userIdx];

            // Crear pedido con user_id para que el chequeo de compra funcione
            $order = Order::updateOrCreate(
                ['number' => 'PJ-RV-'.strtoupper(substr(md5($slug.$user->id), 0, 6))],
                [
                    'channel'         => SaleChannel::Online,
                    'user_id'         => $user->id,
                    'status'          => OrderStatus::Entregado,
                    'payment_method'  => 'mercadopago',
                    'payment_status'  => 'aprobado',
                    'shipping_method' => 'envio',
                    'subtotal'        => $product->price,
                    'discount'        => 0,
                    'shipping_cost'   => 0,
                    'total'           => $product->price,
                    'created_at'      => now()->subDays($daysAgo + 5),
                    'updated_at'      => now()->subDays($daysAgo + 5),
                ]
            );

            $order->items()->updateOrCreate(
                ['product_id' => $product->id],
                ['name' => $product->name, 'unit_price' => $product->price, 'quantity' => 1]
            );

            Review::updateOrCreate(
                ['user_id' => $user->id, 'product_id' => $product->id],
                [
                    'author'     => $user->name,
                    'rating'     => $rating,
                    'body'       => $body,
                    'created_at' => now()->subDays($daysAgo),
                    'updated_at' => now()->subDays($daysAgo),
                ]
            );
        }
    }
}

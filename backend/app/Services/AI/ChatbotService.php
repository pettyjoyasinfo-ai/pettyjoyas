<?php

namespace App\Services\AI;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\SiteSetting;
use App\Services\Inventory\InventoryService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Chatbot con IA (Groq — modelos Llama, API compatible OpenAI). Responde
 * consultas sobre el sistema usando datos reales de la base vía "function
 * calling": el modelo decide qué herramienta llamar (buscar productos, ver un
 * pedido, etc.) y nosotros la resolvemos contra la BD. Así la IA nunca inventa
 * precios/stock/estados. El proveedor se configura en services.ai (env AI_*).
 *
 * Las herramientas de acá son el "cerebro" compartido: el futuro bot de
 * WhatsApp va a reusar este mismo servicio en vez de duplicar la lógica.
 */
class ChatbotService
{
    /** Cortafuegos del loop de tool-calling (evita ciclos infinitos). */
    private const MAX_ITERATIONS = 5;

    /** Cliente autenticado (si lo hay) — habilita consultar SUS pedidos. */
    private ?Customer $customer = null;

    /** Canal desde el que llega la consulta: 'web' (widget del sitio) o 'whatsapp'. */
    private string $channel = 'web';

    public function __construct(private InventoryService $inventory) {}

    /**
     * @param  array<int,array{role:string,content:string}>  $messages  Historial (user/assistant).
     * @param  Customer|null  $customer  Cliente logueado, para acceder a sus pedidos.
     * @param  string  $channel  'web' o 'whatsapp' — ajusta el tono/avisos del prompt.
     */
    public function chat(array $messages, ?Customer $customer = null, string $channel = 'web'): string
    {
        if (! config('services.ai.key')) {
            return 'El asistente todavía no está configurado. Escribinos por WhatsApp y te ayudamos al toque 💛';
        }

        $this->customer = $customer;
        $this->channel = $channel;

        $payload = array_merge(
            [['role' => 'system', 'content' => $this->systemPrompt()]],
            $messages,
        );

        // Los modelos Llama de Groq tienden a re-llamar la misma herramienta en
        // vez de redactar con el resultado que ya tienen (quedan en loop). Por
        // eso limitamos las rondas de tool-calling: pasado el tope, o si el
        // modelo repite una llamada ya hecha, forzamos una respuesta en texto
        // (callModel sin tools) usando lo que ya está en el contexto.
        $maxToolRounds = 2;
        $rounds = 0;
        $executed = [];

        for ($i = 0; $i < self::MAX_ITERATIONS; $i++) {
            $withTools = $rounds < $maxToolRounds;
            $message = $this->callModel($payload, $withTools);
            if ($message === null) {
                return 'Uy, tuve un problema para responderte. Probá de nuevo en un momento 🙏';
            }

            // El mensaje del asistente se re-agrega tal cual (puede traer tool_calls).
            $payload[] = $message;

            $calls = $withTools ? ($message['tool_calls'] ?? []) : [];

            if (! empty($calls)) {
                $huboLlamadaNueva = false;

                foreach ($calls as $call) {
                    $name = $call['function']['name'] ?? '';
                    $rawArgs = $call['function']['arguments'] ?? '{}';
                    $args = json_decode($rawArgs, true) ?: [];
                    $result = $this->runTool($name, $args);

                    $payload[] = [
                        'role'         => 'tool',
                        'tool_call_id' => $call['id'] ?? '',
                        'content'      => json_encode($result, JSON_UNESCAPED_UNICODE),
                    ];

                    $sig = $name.':'.$rawArgs;
                    if (! isset($executed[$sig])) {
                        $executed[$sig] = true;
                        $huboLlamadaNueva = true;
                    }
                }

                $rounds++;
                // Si solo repitió herramientas ya ejecutadas, no tiene sentido
                // seguir en modo tools: que redacte con lo que ya tiene.
                if (! $huboLlamadaNueva) {
                    $rounds = $maxToolRounds;
                }

                continue; // otra vuelta para que el modelo use los resultados
            }

            return trim($message['content'] ?? '') ?: 'No estoy seguro de eso. ¿Lo reformulás?';
        }

        return 'Se me complicó armar la respuesta. ¿Me lo preguntás de otra forma? 🙏';
    }

    // ─── Llamada HTTP al modelo (Groq / compatible OpenAI) ─────────────────

    /**
     * Devuelve el `message` de la respuesta del modelo, o null si falló.
     *
     * $withTools=false se usa como reintento: los modelos Llama de Groq a
     * veces, en la vuelta donde ya tienen los resultados de una herramienta,
     * emiten un tool-call malformado (error tool_use_failed) en vez de
     * responder. Reintentando esa misma llamada SIN tools, el modelo responde
     * en texto usando lo que ya tiene en el contexto.
     */
    private function callModel(array $messages, bool $withTools = true): ?array
    {
        try {
            $body = [
                'model'       => config('services.ai.model'),
                'messages'    => $messages,
                'temperature' => 0.4,
            ];
            if ($withTools) {
                $body['tools'] = $this->toolSchemas();
            }

            $response = Http::withToken(config('services.ai.key'))
                ->timeout(30)
                ->post(rtrim(config('services.ai.base_url'), '/').'/chat/completions', $body);

            if ($response->failed()) {
                if ($withTools && str_contains($response->body(), 'tool_use_failed')) {
                    return $this->callModel($messages, withTools: false);
                }
                Log::error('AI chat error', ['status' => $response->status(), 'body' => $response->body()]);
                return null;
            }

            return $response->json('choices.0.message');
        } catch (\Throwable $e) {
            Log::error('AI chat exception: '.$e->getMessage());
            return null;
        }
    }

    // ─── System prompt ─────────────────────────────────────────────────────

    private function systemPrompt(): string
    {
        $shipping = SiteSetting::allWithDefaults()['shipping'];
        $payment  = SiteSetting::allWithDefaults()['payment'];
        $envioGratis = number_format((int) round(($shipping['gratis_desde'] ?? 0) / 100), 0, ',', '.');
        $descTransfer = (int) ($payment['descuento_transferencia'] ?? 0);

        $quienEs = $this->customer
            ? "El cliente está logueado: {$this->customer->name} ({$this->customer->email}). Podés usar la herramienta mis_pedidos para ver sus pedidos."
            : 'El cliente NO está logueado. Si pregunta por SUS pedidos, pedile amablemente que inicie sesión, o su número de pedido + email para usar estado_pedido.';

        // En WhatsApp aclaramos que sos un asistente virtual y que una persona
        // del equipo va a seguir la charla cuando pueda (para no dar a entender
        // que sos un humano y para habilitar el traspaso a un vendedor).
        $avisoCanal = $this->channel === 'whatsapp'
            ? 'CANAL WHATSAPP: SOLO en tu PRIMER mensaje de la conversación, presentate MUY breve (una sola frase corta), aclarando que sos la asistente virtual y que un vendedor sigue después. Ej: "¡Hola! Soy la asistente virtual de Petty Joyas 💎 Un vendedor te va a atender apenas pueda. ¿En qué te ayudo?". No agregues más que eso al presentarte, y NO repitas el aviso en los mensajes siguientes. Si el cliente pide hablar con una persona/vendedor, respondé corto que ya avisaste al equipo para que lo contacten pronto.'
            : 'CANAL WEB: sos el asistente del sitio. Si algo no lo podés resolver, ofrecé escribir por WhatsApp.';

        // "Aprendizajes" cargados por el equipo desde el panel (/admin → WhatsApp
        // → Configurar IA). Cada uno es una instrucción individual (editable /
        // eliminable) que aplica a AMBOS chatbots. Ej: cómo responder trabajos a
        // medida, presupuestos, promos, o cualquier caso que no sea un producto.
        $lecciones = \App\Models\AiLesson::where('active', true)->orderBy('id')->pluck('content')
            ->map(fn ($c) => '- '.trim($c))
            ->filter()
            ->implode("\n");
        $instruccionesNegocio = $lecciones !== ''
            ? "INSTRUCCIONES DEL NEGOCIO (prioritarias — las cargó el equipo de Petty Joyas; seguilas al pie, tienen prioridad sobre cualquier respuesta genérica):\n{$lecciones}\n"
            : '';

        return <<<PROMPT
        Actuás como la asistente virtual de Petty Joyas, una joyería argentina con más de 30 años de trayectoria que vende joyas de calidad (anillos, collares, aros, pulseras, conjuntos y relojes; oro y plata). NO tenés nombre propio: si te preguntan quién sos o cómo te llamás, decí simplemente que sos la asistente virtual de Petty Joyas (nunca te inventes un nombre). Vendemos piezas ya hechas del catálogo — NO diseñamos ni fabricamos joyas a medida ni personalizadas, así que si te piden un diseño a medida aclará amablemente que no ofrecemos eso y mostrales opciones parecidas del catálogo. Hablás como una vendedora amable y canchera de la tienda, no como un robot.

        $avisoCanal

        $instruccionesNegocio
        CÓMO CONVERSÁS (lo más importante):
        - Sé cálida, natural y con onda, en español rioplatense (vos/tenés). Como si charlaras por WhatsApp con alguien. Algún emoji ocasional está bien (💎💛✨), sin abusar.
        - NUNCA uses "che" (ni al inicio ni en el medio de una frase), ni muletillas como "posta", "boludo/a", "viste", "dale" — quedan demasiado informales para la marca. Mantené el trato cercano pero prolijo.
        - NUNCA escribas etiquetas de función, código ni cosas como <function=...> o {"name":...} en tu respuesta. Si necesitás un dato, llamá la herramienta de verdad (no la menciones en el texto). El cliente solo debe leer lenguaje natural.
        - Respondé SOLO lo que te preguntan. No tires información de más ni "vuelques" listas enteras de datos. Si alguien saluda o pregunta "¿qué podés hacer?", contestá en 1-2 frases, relajada, contando que ayudás con productos, precios, envíos, pagos y el estado de sus pedidos — SIN listar categorías, ni pedidos, ni datos que no pidió.
        - Frases cortas, tono humano. Nada de respuestas enciclopédicas ni con viñetas largas, salvo que muestres varios productos (ahí sí una lista corta va bien).
        - Si te preguntan algo general (ej. "hola", "qué venden"), respondé conversando y, si querés, tirá UNA pregunta para entender qué busca. No dispares todas las herramientas de una.

        CUÁNDO USÁS LAS HERRAMIENTAS:
        - Solo cuando el dato concreto hace falta para responder. Precio/stock de un producto → buscar_productos o detalle_producto. Estado de un pedido → mis_pedidos o estado_pedido. Costo de envío puntual → info_envios. Y así.
        - NO llames a varias herramientas "por las dudas". Si preguntan una cosa, traé solo ese dato.
        - Nunca inventes precios, stock, plazos ni estados: si es un dato puntual, salí a buscarlo con la herramienta. Si no aparece, decilo con sinceridad y ofrecé una alternativa.
        - CRÍTICO: nunca afirmes que TENEMOS un producto, categoría, material o tipo de pieza puntual sin haberlo verificado con buscar_productos/detalle_producto en esta misma conversación. No enumeres tipos de productos "de memoria" (ej. "tenemos desde anillos hasta relojes") como si estuvieran garantizados en stock. Si el cliente pregunta si tenés algo, buscalo con la herramienta y respondé SOLO según lo que realmente aparezca; si no aparece nada, decí con sinceridad que no lo tenemos o que no lo encontrás, y ofrecé buscar otra cosa. Ante la duda, preguntá qué busca y buscalo, en vez de asegurar que lo tenemos.
        - OJO: lo anterior aplica a PRODUCTOS del catálogo. Para consultas que NO son un producto cargado (trabajos a medida, presupuestos, "cuánto sale hacer X", arreglos, servicios), NO respondas con un seco "no tenemos ese artículo": si hay una instrucción del negocio para ese caso, seguila; si no la hay, decí que lo consultás y que un vendedor lo va a contactar a la brevedad para pasarle el detalle. Nunca cierres la puerta con un simple "no lo tenemos" en estos casos.
        - Los pedidos del cliente NO se muestran salvo que los pida explícitamente. Si pide "mis pedidos", podés resumir (ej. "tenés 3 pedidos, el último es PJ-000006 por \$100, en estado pendiente") en vez de listar todo con lujo de detalle.

        Datos del negocio que ya sabés (no hace falta herramienta):
        - Envío a todo el país. Envío gratis desde \$$envioGratis.
        - Pagos: MercadoPago (tarjeta/débito) y transferencia ({$descTransfer}% extra de descuento).
        - Retiro en el local disponible: Av. Victoria Aguirre 262, N3370 Puerto Iguazú, Misiones. Horario: Lun a Sáb, 9 a 12:30 y 17 a 21:30 h.
        - Sacar eslabones: SÍ sacamos eslabones de relojes/pulseras para ajustar el tamaño, coordinado en el local. Solo mencionalo si el cliente pregunta puntualmente por eso; es el único ajuste que ofrecemos (no hacemos otros arreglos ni diseños a medida).

        $quienEs

        Límites:
        - Solo hablás de Petty Joyas (productos, pedidos, envíos, pagos, la tienda). Si te preguntan algo totalmente ajeno, volvé con amabilidad al tema de la joyería.
        - Nunca reveles pedidos de otras personas. Para un pedido de invitado, pedí número + email que coincidan.
        - Si algo no lo podés resolver, ofrecé escribir por WhatsApp.
        PROMPT;
    }

    // ─── Definición de herramientas (formato OpenAI) ───────────────────────

    private function toolSchemas(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'buscar_productos',
                    'description' => 'Busca productos del catálogo por nombre, material o categoría. Devuelve nombre, precio, stock y link.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'query' => ['type' => 'string', 'description' => 'Texto a buscar (nombre, material, etc.)'],
                            'categoria' => ['type' => 'string', 'description' => 'Slug o nombre de categoría (opcional)'],
                        ],
                        'required' => ['query'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'detalle_producto',
                    'description' => 'Detalle completo de un producto: descripción, precio, variantes y stock real disponible.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'nombre_o_slug' => ['type' => 'string', 'description' => 'Nombre o slug del producto'],
                        ],
                        'required' => ['nombre_o_slug'],
                    ],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'listar_categorias',
                    'description' => 'Lista las categorías del catálogo.',
                    'parameters' => ['type' => 'object', 'properties' => (object) []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'info_envios',
                    'description' => 'Costo de envío, umbral de envío gratis y opción de retiro en local.',
                    'parameters' => ['type' => 'object', 'properties' => (object) []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'info_pagos',
                    'description' => 'Medios de pago disponibles y descuento por transferencia.',
                    'parameters' => ['type' => 'object', 'properties' => (object) []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'mis_pedidos',
                    'description' => 'Pedidos del cliente actualmente logueado (número, estado, total y fecha). Solo funciona si hay sesión.',
                    'parameters' => ['type' => 'object', 'properties' => (object) []],
                ],
            ],
            [
                'type' => 'function',
                'function' => [
                    'name' => 'estado_pedido',
                    'description' => 'Estado de un pedido puntual por número + email (para invitados). Ambos deben coincidir.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'numero' => ['type' => 'string', 'description' => 'Número de pedido, ej. PJ-000123'],
                            'email' => ['type' => 'string', 'description' => 'Email con el que se hizo el pedido'],
                        ],
                        'required' => ['numero', 'email'],
                    ],
                ],
            ],
        ];
    }

    // ─── Ejecución de herramientas ─────────────────────────────────────────

    private function runTool(string $name, array $args): array
    {
        return match ($name) {
            'buscar_productos' => $this->buscarProductos($args['query'] ?? '', $args['categoria'] ?? null),
            'detalle_producto' => $this->detalleProducto($args['nombre_o_slug'] ?? ''),
            'listar_categorias' => $this->listarCategorias(),
            'info_envios' => $this->infoEnvios(),
            'info_pagos' => $this->infoPagos(),
            'mis_pedidos' => $this->misPedidos(),
            'estado_pedido' => $this->estadoPedido($args['numero'] ?? '', $args['email'] ?? ''),
            default => ['error' => 'Herramienta desconocida.'],
        };
    }

    /** Palabras sin valor de búsqueda (no aportan al match contra nombre/descripción). */
    private const STOPWORDS = [
        'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'para', 'con', 'sin', 'en', 'y', 'o', 'a', 'que', 'tal', 'vez',
        'me', 'te', 'se', 'mi', 'tu', 'su',
    ];

    private function buscarProductos(string $query, ?string $categoria): array
    {
        $q = Product::query()->with('category')->where('active', true);

        // Antes se buscaba la frase completa como un solo bloque ("%plata
        // cintillo para mujer%"), que casi nunca matchea aunque el producto
        // exista (el nombre/descripción rara vez repite la frase textual del
        // cliente). Ahora se busca por cada palabra significativa por
        // separado (OR entre palabras, OR entre campos) — así "plata
        // cintillo mujer" encuentra productos que mencionan "plata" o
        // "cintillo", aunque "mujer" no aparezca en ningún lado.
        $palabras = array_values(array_filter(
            preg_split('/\s+/', trim($query)) ?: [],
            fn ($w) => mb_strlen($w) >= 3 && ! in_array(mb_strtolower($w), self::STOPWORDS, true),
        ));
        if (! $palabras) {
            $palabras = array_filter([trim($query)]);
        }

        if ($palabras) {
            $q->where(function ($w) use ($palabras) {
                foreach ($palabras as $palabra) {
                    $w->orWhere('name', 'like', "%{$palabra}%")
                        ->orWhere('short_description', 'like', "%{$palabra}%")
                        ->orWhere('collection', 'like', "%{$palabra}%");
                }
            });
        }
        if ($categoria) {
            $q->whereHas('category', fn ($c) => $c
                ->where('slug', $categoria)->orWhere('name', 'like', "%{$categoria}%"));
        }

        $products = $q->orderByDesc('rating')->limit(8)->get();

        if ($products->isEmpty()) {
            return ['resultados' => [], 'mensaje' => 'No se encontraron productos para esa búsqueda.'];
        }

        return [
            'resultados' => $products->map(fn (Product $p) => [
                'nombre' => $p->name,
                'precio' => (int) $p->price,
                'categoria' => $p->category?->name,
                'stock_disponible' => $this->inventory->currentStock($p->id),
                'url' => config('app.frontend_url').'/producto/'.$p->slug,
            ])->all(),
        ];
    }

    private function detalleProducto(string $term): array
    {
        $product = Product::with(['category', 'variants'])
            ->where('active', true)
            ->where(fn ($w) => $w->where('slug', $term)->orWhere('name', 'like', "%{$term}%"))
            ->first();

        if (! $product) {
            return ['error' => 'No encontré ese producto. ¿Me pasás el nombre exacto?'];
        }

        $variantes = $product->variants->map(fn ($v) => [
            'etiqueta' => $v->label,
            'precio' => (int) $product->price + (int) $v->price_delta,
            'stock_disponible' => $this->inventory->currentStock($product->id, $v->id),
        ])->all();

        return [
            'nombre' => $product->name,
            'precio' => (int) $product->price,
            'precio_anterior' => $product->compare_at_price ? (int) $product->compare_at_price : null,
            'descripcion' => $product->short_description ?: $product->description,
            'categoria' => $product->category?->name,
            'stock_disponible' => $variantes ? null : $this->inventory->currentStock($product->id),
            'variantes' => $variantes,
            'url' => config('app.frontend_url').'/producto/'.$product->slug,
        ];
    }

    private function listarCategorias(): array
    {
        return [
            'categorias' => \App\Models\Category::whereNull('parent_id')
                ->orderBy('position')
                ->pluck('name')
                ->all(),
        ];
    }

    private function infoEnvios(): array
    {
        $shipping = SiteSetting::allWithDefaults()['shipping'];

        return [
            'costo_estandar' => (int) round(($shipping['costo_estandar'] ?? 0) / 100),
            'envio_gratis_desde' => (int) round(($shipping['gratis_desde'] ?? 0) / 100),
            'retiro_en_local' => (bool) ($shipping['retiro_enabled'] ?? true),
            'direccion_local' => $shipping['retiro_direccion'] ?? null,
            'alcance' => 'Envíos a todo el país.',
        ];
    }

    private function infoPagos(): array
    {
        $payment = SiteSetting::allWithDefaults()['payment'];

        return [
            'mercadopago' => (bool) ($payment['mercadopago_enabled'] ?? true),
            'transferencia' => (bool) ($payment['transferencia_enabled'] ?? true),
            'descuento_transferencia_pct' => (int) ($payment['descuento_transferencia'] ?? 0),
        ];
    }

    private function misPedidos(): array
    {
        if (! $this->customer) {
            return ['error' => 'El cliente no está logueado. Pedile que inicie sesión o que te pase número + email del pedido.'];
        }

        $orders = Order::where('customer_id', $this->customer->id)->latest()->limit(10)->get();

        if ($orders->isEmpty()) {
            return ['pedidos' => [], 'mensaje' => 'Todavía no tenés pedidos registrados.'];
        }

        return [
            'pedidos' => $orders->map(fn (Order $o) => [
                'numero' => $o->number,
                'estado' => $o->status?->value,
                'total' => (int) $o->total,
                'fecha' => $o->created_at?->toDateString(),
            ])->all(),
        ];
    }

    private function estadoPedido(string $numero, string $email): array
    {
        $order = Order::with('customer')
            ->where('number', strtoupper(trim($numero)))
            ->whereHas('customer', fn ($q) => $q->whereRaw('LOWER(email) = ?', [strtolower(trim($email))]))
            ->first();

        if (! $order) {
            return ['error' => 'No encontré un pedido con ese número y email. Verificá que ambos sean correctos.'];
        }

        return [
            'numero' => $order->number,
            'estado' => $order->status?->value,
            'total' => (int) $order->total,
            'fecha' => $order->created_at?->toDateString(),
        ];
    }
}

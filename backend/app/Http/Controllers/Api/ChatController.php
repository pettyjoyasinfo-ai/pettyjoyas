<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Services\AI\ChatbotService;
use Illuminate\Http\Request;

/**
 * Chatbot con IA (Groq) del sitio. Público: cualquiera puede preguntar por
 * catálogo, envíos y pagos. Si viene un token de cliente (Sanctum), se vincula
 * su Customer para que la IA pueda consultar SUS pedidos.
 */
class ChatController extends Controller
{
    public function __construct(private ChatbotService $bot) {}

    public function send(Request $request)
    {
        $data = $request->validate([
            'messages'             => ['required', 'array', 'min:1', 'max:30'],
            'messages.*.role'      => ['required', 'string', 'in:user,assistant'],
            'messages.*.content'   => ['required', 'string', 'max:2000'],
        ]);

        // Solo dejamos pasar los campos que espera la API (rol + contenido).
        $messages = array_map(
            fn ($m) => ['role' => $m['role'], 'content' => $m['content']],
            $data['messages'],
        );

        // Cliente logueado (opcional): habilita la herramienta "mis_pedidos".
        $customer = null;
        if ($user = $request->user('sanctum')) {
            $customer = Customer::where('email', $user->email)->first();
        }

        $reply = $this->bot->chat($messages, $customer);

        return response()->json(['reply' => $reply]);
    }
}

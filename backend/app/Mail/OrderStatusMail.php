<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        $subjects = [
            'preparacion' => "Estamos preparando tu pedido {$this->order->number}",
            'enviado'     => "Tu pedido {$this->order->number} va en camino 🚚",
            'entregado'   => "¡Tu pedido {$this->order->number} fue entregado! 💖",
            'cancelado'   => "Tu pedido {$this->order->number} fue cancelado",
            'pagado'      => "Confirmamos el pago de tu pedido {$this->order->number}",
            'reserva'     => "Reserva confirmada — pedido {$this->order->number}",
        ];
        $status = $this->order->status?->value;

        return new Envelope(
            subject: $subjects[$status] ?? "Actualización de tu pedido {$this->order->number}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-status',
            with: ['order' => $this->order],
        );
    }
}

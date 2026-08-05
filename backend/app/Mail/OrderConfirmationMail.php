<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    /** @param array<string,mixed> $transfer Datos bancarios (sólo si paga por transferencia). */
    public function __construct(
        public Order $order,
        public array $transfer = [],
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Recibimos tu pedido {$this->order->number} 🛍️",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-confirmation',
            with: ['order' => $this->order, 'transfer' => $this->transfer],
        );
    }
}

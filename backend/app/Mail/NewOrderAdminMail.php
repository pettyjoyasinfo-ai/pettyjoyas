<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewOrderAdminMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        $total = number_format((int) $this->order->total, 0, ',', '.');

        return new Envelope(
            subject: "🛍️ Nuevo pedido {$this->order->number} · \${$total}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-order-admin',
            with: ['order' => $this->order],
        );
    }
}

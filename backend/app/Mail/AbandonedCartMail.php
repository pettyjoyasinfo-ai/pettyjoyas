<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AbandonedCartMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $name,
        public readonly array $items,
        public readonly ?string $customSubject = null,
        public readonly ?string $customBody = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->customSubject ?? 'Olvidaste algo en tu carrito 💛',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.abandoned-cart');
    }
}

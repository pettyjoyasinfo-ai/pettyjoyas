<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $name,
        public string $coupon = 'BIENVENIDA10',
        public ?string $customSubject = null,
        public ?string $customBody = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->customSubject ?? '¡Bienvenida a Petty Joyas! Tu 10% de regalo 💎',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome',
            with: ['name' => $this->name, 'coupon' => $this->coupon, 'customBody' => $this->customBody],
        );
    }
}

<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BirthdayMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $name,
        public readonly ?string $customSubject = null,
        public readonly ?string $customBody = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->customSubject ?? '¡Feliz cumpleaños! 🎂 Un regalo de Petty Joyas para vos',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.birthday');
    }
}

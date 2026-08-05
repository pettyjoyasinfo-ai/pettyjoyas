<?php

namespace App\Mail;

use App\Models\Coupon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CouponPrivateMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Coupon $coupon,
        public readonly string $recipientName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Tenés un cupón exclusivo de Petty Joyas 🎁',
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.coupon-private');
    }
}

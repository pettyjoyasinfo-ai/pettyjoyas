@php
    $firstName = $customerName ? explode(' ', trim($customerName))[0] : 'Hola';
@endphp

<x-emails.layout title="{{ $emailSubject }}" preheader="{{ $emailSubject }}">

    <h1 style="margin:0 0 6px; font-size:23px; color:#2b2b2b;">Hola, {{ $firstName }} 👋</h1>
    <p style="margin:0 0 18px; font-size:14px; color:#555;">Recibís este mensaje del equipo de Petty Joyas:</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf3f6; border-left:4px solid #821f40; border-radius:0 12px 12px 0; margin:0 0 22px;">
        <tr><td style="padding:16px 18px; font-size:15px; line-height:1.7; color:#2b2b2b; white-space:pre-wrap;">{{ $body }}</td></tr>
    </table>

    <p style="margin-top:12px; font-size:13px; color:#888;">Si tenés dudas, podés responder este correo o escribirnos directamente.</p>

</x-emails.layout>

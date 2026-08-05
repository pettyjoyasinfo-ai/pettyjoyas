<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'mercadopago' => [
        'public_key'     => env('MP_PUBLIC_KEY'),
        'token'          => env('MP_ACCESS_TOKEN'),
        'client_id'      => env('MP_CLIENT_ID'),
        'client_secret'  => env('MP_CLIENT_SECRET'),
        'webhook_secret' => env('MP_WEBHOOK_SECRET'),
    ],

    'transfer' => [
        'alias'  => env('BANK_ALIAS', 'pettyjoyas.mp'),
        'cbu'    => env('BANK_CBU', ''),
        'bank'   => env('BANK_NAME', 'Mercado Pago'),
        'holder' => env('BANK_HOLDER', 'Petty Joyas'),
    ],

    'whatsapp' => [
        'token' => env('WHATSAPP_TOKEN'),
        'phone_id' => env('WHATSAPP_PHONE_ID'),
        'verify_token' => env('WHATSAPP_VERIFY_TOKEN', 'petty-verify'),
        'app_secret' => env('WHATSAPP_APP_SECRET'),
    ],

    'meta' => [
        'pixel_id' => env('META_PIXEL_ID'),
        'capi_token' => env('META_CAPI_TOKEN'),
    ],

    // Revalidación instantánea del frontend (Next.js) al guardar un producto,
    // para no depender de la ventana de caché ISR (revalidate=60).
    'frontend' => [
        'revalidate_url' => env('FRONTEND_REVALIDATE_URL', 'https://www.pettyjoyas.com.ar/api/revalidate'),
        'revalidate_secret' => env('FRONTEND_REVALIDATE_SECRET', '67f19ca37c731262ea220194d67c3a98575454b623e405426e820fb92699f072'),
    ],

    'anthropic' => [
        'key' => env('ANTHROPIC_API_KEY'),
    ],

    // Chatbot con IA. Proveedor actual: Groq (gratis, api.groq.com — OJO: NO es
    // el "Grok" de xAI). Como usa formato compatible OpenAI, para cambiar de
    // proveedor alcanza con tocar estas 3 env vars, sin tocar código.
    'ai' => [
        'key'      => env('AI_API_KEY'),
        'model'    => env('AI_MODEL', 'llama-3.3-70b-versatile'),
        'base_url' => env('AI_BASE_URL', 'https://api.groq.com/openai/v1'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    ],

];

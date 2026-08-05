<?php

namespace App\Providers;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Respuestas sin envoltorio "data" para que el JSON calce con los tipos
        // del frontend (Product[], Category[]) sin transformaciones extra.
        JsonResource::withoutWrapping();

        // Modo prueba: si MAIL_TEST_REDIRECT está seteado, TODOS los correos
        // (clientes y admin) se redirigen a esa casilla. En producción se deja
        // vacío y cada correo llega a su destinatario real.
        if ($redirect = config('mail.test_redirect')) {
            Mail::alwaysTo($redirect);
        }
    }
}

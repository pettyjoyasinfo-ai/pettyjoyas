<?php

namespace App\Support;

use App\Mail\AbandonedCartMail;
use App\Mail\BirthdayMail;
use App\Mail\CustomerDirectMail;
use App\Mail\CustomerInvitationMail;
use App\Mail\NewOrderAdminMail;
use App\Mail\OrderConfirmationMail;
use App\Mail\OrderCustomNotificationMail;
use App\Mail\OrderPaidMail;
use App\Mail\OrderStatusMail;
use App\Mail\PostPurchaseMail;
use App\Mail\ReactivationMail;
use App\Mail\StaffWelcomeMail;
use App\Mail\WelcomeMail;
use App\Enums\UserRole;
use App\Models\Customer;
use App\Models\EmailFlow;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Punto único de envío de correos transaccionales.
 *
 * Todos los envíos van envueltos en try/catch: un fallo de SMTP nunca debe
 * romper el flujo de negocio (un checkout no falla porque no salió el mail).
 * Los errores quedan logueados para diagnóstico.
 */
class Mailer
{
    private static function customerEmail(Order $order): ?string
    {
        return $order->customer?->email;
    }

    /**
     * MAIL_ADMIN_ADDRESS admite una o varias direcciones separadas por coma
     * (ej. "pettyjoyas1@outlook.com,joyaspetty@gmail.com") — todas reciben
     * los avisos automáticos de pedidos.
     */
    private static function adminEmails(): array
    {
        $raw = config('mail.admin.address');
        if (! $raw) return [];

        return collect(explode(',', $raw))
            ->map(fn ($e) => trim($e))
            ->filter()
            ->values()
            ->all();
    }

    /**
     * Aviso al equipo: un cliente pidió atención humana por WhatsApp. Va a los
     * usuarios admin del sistema (y si no hay, cae a MAIL_ADMIN_ADDRESS).
     */
    public static function whatsappHandoff(string $contact, string $lastMessage): void
    {
        $admins = User::where('role', UserRole::Admin)
            ->whereNotNull('email')
            ->pluck('email')
            ->all();

        if (! $admins) {
            $admins = self::adminEmails();
        }
        if (! $admins) return;

        $waLink = 'https://wa.me/'.preg_replace('/\D/', '', $contact);

        self::safe(
            fn () => Mail::raw(
                "Un cliente pidió hablar con una persona por WhatsApp.\n\n"
                ."Número: {$contact}\n"
                ."Abrir chat: {$waLink}\n"
                ."Último mensaje: \"{$lastMessage}\"\n\n"
                ."La asistente virtual le sigue respondiendo mientras tanto, "
                ."pero conviene que alguien lo contacte lo antes posible.",
                fn ($m) => $m->to($admins)->subject('🔔 Un cliente pide atención humana (WhatsApp)')
            ),
            "whatsappHandoff {$contact}",
        );
    }

    /** Al crear un pedido: confirma al cliente y (opcional) avisa al administrador. */
    public static function orderPlaced(Order $order, array $transfer = [], bool $notifyAdmin = true): void
    {
        $order->loadMissing(['items', 'customer']);

        if ($email = self::customerEmail($order)) {
            self::safe(
                fn () => Mail::to($email)->send(new OrderConfirmationMail($order, $transfer)),
                "orderConfirmation {$order->number}",
            );
        }

        if ($notifyAdmin && ($admins = self::adminEmails())) {
            self::safe(
                fn () => Mail::to($admins)->send(new NewOrderAdminMail($order)),
                "newOrderAdmin {$order->number}",
            );
        }
    }

    /**
     * Pago acreditado (MP o transferencia confirmada): avisa al cliente.
     * $notifyAdmin: true solo para MercadoPago vía webhook — a esos pedidos
     * no se les avisó nada al crearse (quedan mudos hasta que se pagan de
     * verdad), así que acá es la primera vez que el admin se entera. Para
     * transferencia/efectivo el admin ya confirmó el pago él mismo a mano,
     * no hace falta que se re-notifique.
     */
    public static function orderPaid(Order $order, bool $notifyAdmin = false): void
    {
        $order->loadMissing(['items', 'customer']);

        if ($email = self::customerEmail($order)) {
            self::safe(
                fn () => Mail::to($email)->send(new OrderPaidMail($order)),
                "orderPaid {$order->number}",
            );
        }

        if ($notifyAdmin && ($admins = self::adminEmails())) {
            self::safe(
                fn () => Mail::to($admins)->send(new NewOrderAdminMail($order)),
                "newOrderAdmin(paid) {$order->number}",
            );
        }
    }

    /** Cambio de estado del pedido (preparación, enviado, entregado, cancelado…). */
    public static function orderStatusUpdated(Order $order): void
    {
        $order->loadMissing(['items', 'customer']);

        if ($email = self::customerEmail($order)) {
            self::safe(
                fn () => Mail::to($email)->send(new OrderStatusMail($order)),
                "orderStatus {$order->number}",
            );
        }
    }

    /** Mensaje personalizado del admin al cliente sobre un pedido. */
    public static function orderCustomNotification(Order $order, string $message): void
    {
        $order->loadMissing(['items', 'customer']);

        if ($email = self::customerEmail($order)) {
            self::safe(
                fn () => Mail::to($email)->send(new OrderCustomNotificationMail($order, $message)),
                "orderCustomNotification {$order->number}",
            );
        }
    }

    /** Bienvenida + cupón al registrarse un cliente nuevo. */
    public static function welcome(User $user): void
    {
        if (! $user->email) return;

        $flow = EmailFlow::where('trigger', 'welcome')->first();

        self::safe(
            fn () => Mail::to($user->email)->send(
                new WelcomeMail(
                    $user->name ?: 'Hola',
                    'BIENVENIDA10',
                    $flow?->subject,
                    $flow?->template,
                )
            ),
            "welcome {$user->email}",
        );
    }

    /** Invitación para que un cliente cree su cuenta con contraseña. */
    public static function customerInvitation(Customer $customer, string $token): void
    {
        if (! $customer->email) return;

        self::safe(
            fn () => Mail::to($customer->email)->send(
                new CustomerInvitationMail($customer->name ?? '', $customer->email, $token)
            ),
            "customerInvitation {$customer->email}",
        );
    }

    /** Email directo del admin al cliente (asunto y mensaje libres). */
    public static function customerDirect(Customer $customer, string $subject, string $message): void
    {
        if (! $customer->email) return;

        self::safe(
            fn () => Mail::to($customer->email)->send(
                new CustomerDirectMail($customer->name ?? '', $subject, $message)
            ),
            "customerDirect {$customer->email}",
        );
    }

    /** Felicitación de cumpleaños con cupón CUMPLE25. */
    public static function birthdayWish(Customer $customer, ?EmailFlow $flow = null): void
    {
        if (! $customer->email) return;

        self::safe(
            fn () => Mail::to($customer->email)->send(
                new BirthdayMail(
                    $customer->name ?? '',
                    $flow?->subject,
                    $flow?->template,
                )
            ),
            "birthday {$customer->email}",
        );
    }

    /** Recordatorio de carrito abandonado. */
    public static function abandonedCart(Customer $customer, array $items, ?EmailFlow $flow = null): void
    {
        if (! $customer->email) return;

        self::safe(
            fn () => Mail::to($customer->email)->send(
                new AbandonedCartMail(
                    $customer->name ?? '',
                    $items,
                    $flow?->subject,
                    $flow?->template,
                )
            ),
            "abandonedCart {$customer->email}",
        );
    }

    /** Consejos de cuidado de joya 3 días después de la entrega. */
    public static function postPurchase(Customer $customer, ?EmailFlow $flow = null): void
    {
        if (! $customer->email) return;

        self::safe(
            fn () => Mail::to($customer->email)->send(
                new PostPurchaseMail(
                    $customer->name ?? '',
                    $flow?->subject,
                    $flow?->template,
                )
            ),
            "postPurchase {$customer->email}",
        );
    }

    /** Email de reactivación para clientes inactivos 90 días. */
    public static function reactivation(Customer $customer, ?EmailFlow $flow = null): void
    {
        if (! $customer->email) return;

        self::safe(
            fn () => Mail::to($customer->email)->send(
                new ReactivationMail(
                    $customer->name ?? '',
                    $flow?->subject,
                    $flow?->template,
                )
            ),
            "reactivation {$customer->email}",
        );
    }

    /** Envía credenciales de acceso al panel a un usuario staff recién creado. */
    public static function staffWelcome(User $user, string $plainPassword): void
    {
        if (! $user->email) return;

        self::safe(
            fn () => Mail::to($user->email)->send(
                new StaffWelcomeMail($user->name, $user->email, $plainPassword, $user->role->value ?? $user->role)
            ),
            "staffWelcome {$user->email}",
        );
    }

    private static function safe(callable $fn, string $context): void
    {
        try {
            $fn();
        } catch (\Throwable $e) {
            Log::warning("Envío de mail falló: {$context} — {$e->getMessage()}");
        }
    }
}

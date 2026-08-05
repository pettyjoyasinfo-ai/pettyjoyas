<?php

namespace App\Http\Controllers\Api;

use App\Actions\Customers\InviteCustomerAction;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Customer;
use App\Models\CustomerInvitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            ...$request->validated(),
            'role' => UserRole::Cliente,
        ]);

        $this->linkGuestHistory($user);

        \App\Support\Mailer::welcome($user);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Las credenciales no son válidas.',
            ]);
        }

        if ($user->active === false) {
            throw ValidationException::withMessages([
                'email' => 'Esta cuenta está suspendida. Contactá al administrador.',
            ]);
        }

        $this->linkGuestHistory($user);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * Vincula compras hechas como invitado (mismo email, sin cuenta) a este
     * usuario recién logueado/registrado. El historial de pedidos ya se ve
     * por email (AccountController::orders()); esto además deja el dato del
     * CRM consistente (Customer.user_id).
     */
    private function linkGuestHistory(User $user): void
    {
        Customer::where('email', $user->email)->whereNull('user_id')->update(['user_id' => $user->id]);
    }

    /**
     * Login con Google: recibe el ID token (credential) de Google Identity
     * Services, lo verifica contra Google, y crea/vincula el usuario por email.
     */
    public function google(Request $request): JsonResponse
    {
        $request->validate(['credential' => ['required', 'string']]);

        // Verificación del ID token directamente con Google (sin SDK).
        $info = Http::get('https://oauth2.googleapis.com/tokeninfo', [
            'id_token' => $request->credential,
        ])->json();

        $clientId = config('services.google.client_id');

        if (! isset($info['sub']) || ($clientId && ($info['aud'] ?? null) !== $clientId)) {
            throw ValidationException::withMessages([
                'credential' => 'No se pudo verificar la cuenta de Google.',
            ]);
        }

        $user = User::where('google_id', $info['sub'])
            ->orWhere('email', $info['email'])
            ->first();

        if ($user) {
            $user->update([
                'google_id' => $info['sub'],
                'avatar' => $info['picture'] ?? $user->avatar,
            ]);
        } else {
            $user = User::create([
                'name' => $info['name'] ?? 'Cliente',
                'email' => $info['email'],
                'google_id' => $info['sub'],
                'avatar' => $info['picture'] ?? null,
                'password' => Hash::make(Str::random(40)),
                'role' => UserRole::Cliente,
            ]);
        }

        $this->linkGuestHistory($user);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $user->createToken('api')->plainTextToken,
        ]);
    }

    /**
     * El cliente invitado establece su contraseña por primera vez.
     * Valida el token de invitación, crea el User, lo linkea al Customer y lo loguea.
     */
    public function acceptInvitation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token'                 => ['required', 'string'],
            'email'                 => ['required', 'email'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
        ]);

        $invitation = CustomerInvitation::where('token', $data['token'])
            ->where('email', $data['email'])
            ->first();

        if (! $invitation) {
            throw ValidationException::withMessages([
                'token' => 'El link de invitación no es válido.',
            ]);
        }

        if ($invitation->isExpired()) {
            throw ValidationException::withMessages([
                'token' => 'El link de invitación ya expiró.',
            ]);
        }

        if (User::where('email', $data['email'])->exists()) {
            throw ValidationException::withMessages([
                'email' => 'Ya existe una cuenta con este email. Iniciá sesión.',
            ]);
        }

        $user = User::create([
            'name'     => Customer::where('email', $data['email'])->value('name') ?? 'Cliente',
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => UserRole::Cliente,
        ]);

        Customer::where('email', $data['email'])->whereNull('user_id')->update(['user_id' => $user->id]);

        $invitation->delete();

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Regenera el token de invitación y reenvía el email.
     * Accesible desde el admin (detalle de cliente) y desde la página de bienvenida si el token expiró.
     */
    public function resendInvitation(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        if (User::where('email', $data['email'])->exists()) {
            return response()->json(['message' => 'Ya existe una cuenta con este email.'], 422);
        }

        $customer = Customer::where('email', $data['email'])->first();

        if (! $customer) {
            return response()->json(['message' => 'Cliente no encontrado.'], 404);
        }

        (new InviteCustomerAction)->execute($customer);

        return response()->json(['message' => 'Invitación reenviada correctamente.']);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada.']);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}

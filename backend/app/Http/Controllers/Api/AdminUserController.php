<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\Mailer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Gestión de usuarios staff (admin y vendedor) desde el panel de configuración.
 * Solo accesible para usuarios con rol admin.
 */
class AdminUserController extends Controller
{
    /** Lista todos los usuarios staff. */
    public function index()
    {
        $users = User::whereIn('role', [UserRole::Admin->value, UserRole::Vendedor->value])
            ->orderBy('name')
            ->get();

        return UserResource::collection($users);
    }

    /** Crea un nuevo usuario staff. */
    public function store(Request $request)
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'email'         => ['required', 'email', 'max:255', 'unique:users,email'],
            'role'          => ['required', Rule::in(['admin', 'vendedor'])],
            'phone'         => ['nullable', 'string', 'max:30'],
            'password'      => ['required', 'string', 'min:8'],
            // Solo aplica a vendedor — un admin siempre ve todo el panel.
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ]);

        $plainPassword = $data['password'];

        $user = User::create([
            ...$data,
            'password' => Hash::make($plainPassword),
            'active'   => true,
        ]);

        Mailer::staffWelcome($user, $plainPassword);

        return new UserResource($user);
    }

    /** Actualiza nombre, email, rol, teléfono, estado activo o contraseña. */
    public function update(Request $request, User $user)
    {
        $this->requireAdmin($request);
        abort_if(
            $user->id === $request->user()->id && isset($request->active) && ! $request->active,
            422,
            'No podés suspender tu propia cuenta.'
        );

        $data = $request->validate([
            'name'          => ['sometimes', 'string', 'max:255'],
            'email'         => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role'          => ['sometimes', Rule::in(['admin', 'vendedor'])],
            'phone'         => ['nullable', 'string', 'max:30'],
            'active'        => ['sometimes', 'boolean'],
            'password'      => ['sometimes', 'nullable', 'string', 'min:8'],
            'permissions'   => ['sometimes', 'nullable', 'array'],
            'permissions.*' => ['string'],
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return new UserResource($user->fresh());
    }

    private function requireAdmin(Request $request): void
    {
        abort_if($request->user()->role !== UserRole::Admin, 403, 'Solo administradores pueden gestionar usuarios.');
    }
}

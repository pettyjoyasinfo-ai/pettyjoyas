<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Perfil del usuario autenticado (staff): nombre, email, teléfono, contraseña.
 */
class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'                  => ['sometimes', 'string', 'max:255'],
            'email'                 => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone'                 => ['nullable', 'string', 'max:30'],
            'current_password'      => ['required_with:password', 'current_password'],
            'password'              => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['sometimes', 'string'],
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
            // Cambió la contraseña con éxito: ya no hace falta forzarlo de nuevo.
            $data['must_change_password'] = false;
        } else {
            unset($data['password']);
        }
        unset($data['current_password'], $data['password_confirmation']);

        $user->update($data);

        return new UserResource($user->fresh());
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->id,
            'name'     => $this->name,
            'email'    => $this->email,
            'role'     => $this->role?->value,
            // NULL = admin (sin restricción). Para vendedor, lista de módulos
            // visibles en el panel; array vacío = ningún módulo extra.
            'permissions' => $this->permissions,
            'mustChangePassword' => (bool) $this->must_change_password,
            'active'   => (bool) $this->active,
            'phone'    => $this->phone,
            'birthday' => $this->birthday?->toDateString(),
            'avatar'   => $this->avatar,
            'isStaff'  => $this->isStaff(),
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStaff() ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('customer')?->id;

        return [
            'name' => [$this->isMethod('post') ? 'required' : 'sometimes', 'string', 'max:255'],
            'email' => ['nullable', 'email', "unique:customers,email,{$id}"],
            'phone' => ['nullable', 'string', 'max:30'],
            'birthday' => ['nullable', 'date'],
            'document' => ['nullable', 'string'],
            'segment' => ['nullable', 'in:nuevo,recurrente,vip,inactivo'],
            'vip' => ['boolean'],
            'tags' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ];
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStaff() ?? false;
    }

    public function rules(): array
    {
        $coupon = $this->route('coupon');

        return [
            'code'          => ['required', 'string', Rule::unique('coupons', 'code')->ignore($coupon)],
            'type'          => ['required', 'in:percent,fixed'],
            'value'         => ['required', 'integer', 'min:1'],
            'min_subtotal'  => ['nullable', 'integer', 'min:0'],
            'max_uses'      => ['nullable', 'integer', 'min:1'],
            'expires_at'    => ['nullable', 'date'],
            'active'        => ['boolean'],
            'is_public'     => ['boolean'],
            'description'   => ['nullable', 'string', 'max:200'],
            'send_to_email' => ['nullable', 'email'],
        ];
    }
}

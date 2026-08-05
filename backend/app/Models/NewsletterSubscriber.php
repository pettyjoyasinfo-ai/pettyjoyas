<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsletterSubscriber extends Model
{
    protected $fillable = ['email', 'name', 'active', 'customer_id'];

    protected $casts = ['active' => 'boolean'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /** Intenta vincular este suscriptor al cliente con el mismo email. */
    public function linkToCustomer(): void
    {
        if ($this->customer_id) return;
        $customer = Customer::where('email', $this->email)->first();
        if ($customer) {
            $this->update(['customer_id' => $customer->id]);
        }
    }
}

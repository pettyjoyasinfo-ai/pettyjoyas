<?php

namespace App\Http\Controllers\Api;

use App\Actions\Customers\InviteCustomerAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Models\User;
use App\Support\Mailer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $customers = Customer::query()
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->when($request->query('segmento'), fn ($q, $s) => $q->where('segment', $s))
            ->when($request->boolean('vip'), fn ($q) => $q->where('vip', true))
            ->when($request->query('q'), fn ($q, $term) => $q->where(function ($w) use ($term) {
                $w->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%");
            }))
            ->latest()
            ->paginate(24);

        return CustomerResource::collection($customers);
    }

    public function show(Customer $customer)
    {
        $customer->loadCount('orders')->loadSum('orders', 'total');
        $customer->load([
            'orders' => fn ($q) => $q->with('items')->latest(),
            'newsletterSubscriber',
        ]);

        return new CustomerResource($customer);
    }

    public function store(StoreCustomerRequest $request)
    {
        $customer = Customer::create($request->validated());

        if ($customer->email) {
            \App\Models\NewsletterSubscriber::where('email', strtolower($customer->email))
                ->whereNull('customer_id')
                ->update(['customer_id' => $customer->id]);

            // Invitar solo si no existe ya un usuario con ese email
            if (! User::where('email', $customer->email)->exists()) {
                (new InviteCustomerAction)->execute($customer);
            }
        }

        return (new CustomerResource($customer))->response()->setStatusCode(201);
    }

    public function update(StoreCustomerRequest $request, Customer $customer)
    {
        $oldEmail = $customer->email;
        $customer->update($request->validated());

        if ($customer->email && $customer->email !== $oldEmail) {
            \App\Models\NewsletterSubscriber::where('email', strtolower($customer->email))
                ->whereNull('customer_id')
                ->update(['customer_id' => $customer->id]);
        }

        return new CustomerResource(
            $customer->loadCount('orders')->loadSum('orders', 'total')->load('newsletterSubscriber')
        );
    }

    /** Exportar todos los clientes (sin paginar) con los mismos filtros del index. */
    public function export(Request $request)
    {
        $customers = Customer::query()
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->when($request->query('segmento'), fn ($q, $s) => $q->where('segment', $s))
            ->when($request->boolean('vip'), fn ($q) => $q->where('vip', true))
            ->when($request->query('q'), fn ($q, $term) => $q->where(function ($w) use ($term) {
                $w->where('name', 'like', "%{$term}%")->orWhere('email', 'like', "%{$term}%");
            }))
            ->latest()
            ->get();

        return CustomerResource::collection($customers);
    }

    /** Enviar un email directo al cliente desde el admin. */
    public function email(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        if (! $customer->email) {
            return response()->json(['message' => 'Este cliente no tiene email registrado.'], 422);
        }

        Mailer::customerDirect($customer, $data['subject'], $data['message']);

        return response()->json(['message' => 'Email enviado correctamente.']);
    }

    /** Próximos cumpleaños (para la campaña automática). */
    public function birthdays()
    {
        $month = now()->month;
        $customers = Customer::whereNotNull('birthday')
            ->whereMonth('birthday', $month)
            ->orderByRaw('DAY(birthday)')
            ->get();

        return CustomerResource::collection($customers);
    }
}

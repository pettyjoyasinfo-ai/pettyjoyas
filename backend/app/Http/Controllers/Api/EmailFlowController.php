<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\EmailFlow;
use App\Support\Mailer;
use Illuminate\Http\Request;

class EmailFlowController extends Controller
{
    // Triggers de los flujos incorporados (no se pueden eliminar)
    private const BUILT_IN = ['welcome', 'abandoned_cart', 'birthday', 'post_purchase', 'reactivation'];

    public function index()
    {
        return EmailFlow::orderBy('id')->get()->map(fn ($f) => [
            'id'       => $f->id,
            'name'     => $f->name,
            'trigger'  => $f->trigger,
            'subject'  => $f->subject,
            'template' => $f->template,
            'sent'     => $f->sent_count,
            'active'   => (bool) $f->active,
            'builtIn'  => in_array($f->trigger, self::BUILT_IN),
        ]);
    }

    public function toggle(EmailFlow $flow)
    {
        $flow->update(['active' => ! $flow->active]);

        return response()->json(['id' => $flow->id, 'active' => $flow->active]);
    }

    public function update(Request $request, EmailFlow $flow)
    {
        $data = $request->validate([
            'name'     => ['sometimes', 'string', 'max:120'],
            'subject'  => ['sometimes', 'nullable', 'string', 'max:200'],
            'template' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'active'   => ['sometimes', 'boolean'],
        ]);

        $flow->update($data);

        return response()->json(['id' => $flow->id, 'active' => $flow->active]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:120'],
            'trigger'  => ['required', 'string', 'max:60', 'unique:email_flows,trigger', 'regex:/^[a-z0-9_]+$/'],
            'subject'  => ['nullable', 'string', 'max:200'],
            'template' => ['nullable', 'string', 'max:5000'],
            'active'   => ['boolean'],
        ]);

        $flow = EmailFlow::create($data);

        return response()->json([
            'id'       => $flow->id,
            'name'     => $flow->name,
            'trigger'  => $flow->trigger,
            'subject'  => $flow->subject,
            'template' => $flow->template,
            'sent'     => 0,
            'active'   => (bool) $flow->active,
            'builtIn'  => false,
        ], 201);
    }

    public function destroy(EmailFlow $flow)
    {
        if (in_array($flow->trigger, self::BUILT_IN)) {
            return response()->json(['message' => 'Este flujo es del sistema y no se puede eliminar.'], 422);
        }

        $flow->delete();

        return response()->noContent();
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Services\WhatsApp\WhatsAppAutomationService;
use Illuminate\Http\Request;

/**
 * "Bloques conversacionales" de WhatsApp (mensaje de bienvenida, ice
 * breakers, comandos). Se guardan en site_settings y se sincronizan con
 * Meta al guardar — es independiente del bot/webhook (que sigue pausado).
 */
class WhatsAppAutomationController extends Controller
{
    private const KEY = 'whatsapp_automation';

    private const DEFAULTS = [
        'welcome_enabled' => true,
        'ice_breakers' => [],
        'commands' => [],
    ];

    /** GET /admin/whatsapp-automation — configuración guardada localmente. */
    public function show()
    {
        $value = SiteSetting::where('key', self::KEY)->value('value');

        return response()->json($value ?? self::DEFAULTS);
    }

    /** PUT /admin/whatsapp-automation — guarda y sincroniza con Meta. */
    public function update(Request $request, WhatsAppAutomationService $service)
    {
        $data = $request->validate([
            'welcome_enabled' => ['boolean'],
            'ice_breakers' => ['array', 'max:4'],
            'ice_breakers.*' => ['nullable', 'string', 'max:80'],
            'commands' => ['array', 'max:30'],
            'commands.*.name' => ['nullable', 'string', 'max:32'],
            'commands.*.description' => ['nullable', 'string', 'max:256'],
        ]);

        SiteSetting::updateOrCreate(['key' => self::KEY], ['value' => $data]);

        $sync = $service->push($data);

        return response()->json([
            'saved' => true,
            'synced' => $sync['ok'],
            'error' => $sync['error'] ?? null,
        ]);
    }

    /** GET /admin/whatsapp-automation/live — lee la config vigente directo de Meta (para verificar). */
    public function live(WhatsAppAutomationService $service)
    {
        $result = $service->fetch();

        return response()->json($result);
    }
}

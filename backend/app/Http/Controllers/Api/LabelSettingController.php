<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateLabelSettingRequest;
use App\Models\SiteSetting;

/**
 * Calibración guardada del formato de etiqueta de joyería (mm, tipo de
 * código, ajuste fino). Reutiliza la tabla `site_settings` (clave/valor)
 * con una clave dedicada, separada de la configuración pública del sitio.
 */
class LabelSettingController extends Controller
{
    private const KEY = 'label_calibration';

    // Calibración verificada contra la etiqueta física real (impresora DP23 +
    // tag de joyería 30×70mm de dos orejas). "Restablecer" vuelve a esto, no a cero.
    private const DEFAULTS = [
        'pageW' => 30, 'pageH' => 70, 'earW' => 15, 'earH' => 25,
        'barcodeSide' => 'left', 'codeType' => 'qr', 'bcFill' => 1,
        'offsetX' => 0.5, 'offsetY' => -0.5,
    ];

    /** GET /admin/label-settings — calibración guardada, o los valores por defecto si nunca se guardó. */
    public function show()
    {
        $value = SiteSetting::where('key', self::KEY)->value('value');

        return response()->json($value ?? self::DEFAULTS);
    }

    /** PUT /admin/label-settings — guarda la calibración (persiste para siempre). */
    public function update(UpdateLabelSettingRequest $request)
    {
        SiteSetting::updateOrCreate(['key' => self::KEY], ['value' => $request->validated()]);

        return response()->json($request->validated());
    }

    /** DELETE /admin/label-settings — borra lo guardado; vuelve a los valores por defecto. */
    public function destroy()
    {
        SiteSetting::where('key', self::KEY)->delete();

        return response()->json(self::DEFAULTS);
    }
}

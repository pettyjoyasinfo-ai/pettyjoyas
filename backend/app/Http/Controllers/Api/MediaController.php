<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\ImageToWebp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MediaController extends Controller
{
    /**
     * Sube una imagen al storage público y la guarda SIEMPRE como WebP optimizado (máx. 1600 px).
     * Acepta cualquier formato habitual (JPG, PNG, WebP, GIF, BMP, HEIC de iPhone, AVIF, TIFF) de
     * hasta 25 MB: el límite es para el original, el WebP final pesa unos cientos de KB.
     * POST /media/upload  (autenticado)
     * Body: multipart/form-data  — campo "file"
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:25600', 'mimes:'.implode(',', ImageToWebp::ACCEPTED)],
            'folder' => ['nullable', 'string'],
        ], [
            'file.max' => 'La imagen pesa más de 25 MB.',
            'file.mimes' => 'Ese archivo no es una imagen compatible (JPG, PNG, WebP, HEIC, AVIF, GIF, TIFF o BMP).',
        ]);

        // Carpeta destino acotada a una lista blanca (evita path traversal).
        $allowed = ['hero', 'products', 'variants', 'categories'];
        $folder = in_array($request->input('folder'), $allowed, true)
            ? $request->input('folder')
            : 'hero';

        $file = $request->file('file');

        // Dedup por contenido: si ya se subió esta misma imagen a esta carpeta
        // (ej. la misma foto de una alianza subida de nuevo para cada talle),
        // reusamos el archivo existente en vez de guardar una copia nueva.
        // El nombre = hash del archivo original, así el mismo contenido
        // siempre cae en el mismo path sin necesidad de una tabla aparte.
        $hash = hash_file('sha256', $file->getRealPath());
        $name = substr($hash, 0, 32) . '.webp';
        $relativePath = 'uploads/' . $folder . '/' . $name;

        if (! Storage::disk('public')->exists($relativePath)) {
            try {
                ImageToWebp::convert($file->getRealPath(), Storage::disk('public')->path($relativePath));
            } catch (\RuntimeException) {
                throw ValidationException::withMessages([
                    'file' => 'No se pudo convertir esa imagen. Probá exportarla como JPG o PNG.',
                ]);
            }
        }

        return response()->json([
            'url' => Storage::disk('public')->url($relativePath),
        ], 201);
    }
}

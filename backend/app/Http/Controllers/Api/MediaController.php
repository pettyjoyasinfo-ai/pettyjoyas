<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    /**
     * Sube un archivo de imagen al storage público, lo convierte a WebP optimizado y devuelve su URL.
     * POST /media/upload  (autenticado)
     * Body: multipart/form-data  — campo "file" (imagen, máx 10 MB)
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'image', 'max:10240'],
            'folder' => ['nullable', 'string'],
        ]);

        // Carpeta destino acotada a una lista blanca (evita path traversal).
        $allowed = ['hero', 'products', 'variants', 'categories'];
        $folder = in_array($request->input('folder'), $allowed, true)
            ? $request->input('folder')
            : 'hero';

        $file = $request->file('file');
        $name = Str::uuid() . '.webp';
        $relativePath = 'uploads/' . $folder . '/' . $name;

        self::saveAsWebp($file, $relativePath);

        return response()->json([
            'url' => Storage::disk('public')->url($relativePath),
        ], 201);
    }

    /**
     * Convierte la imagen subida a formato WebP optimizado (máx 1600px de ancho, calidad 82%).
     */
    public static function saveAsWebp(UploadedFile $uploadedFile, string $relativePath, int $quality = 82, int $maxWidth = 1600): void
    {
        $filePath = $uploadedFile->getRealPath();
        $mime = $uploadedFile->getMimeType();

        $image = match ($mime) {
            'image/jpeg', 'image/jpg' => @imagecreatefromjpeg($filePath),
            'image/png' => @imagecreatefrompng($filePath),
            'image/webp' => @imagecreatefromwebp($filePath),
            'image/gif' => @imagecreatefromgif($filePath),
            default => false,
        };

        if (!$image) {
            // Fallback si no se pudo procesar con GD: guardar original
            $uploadedFile->storeAs(dirname($relativePath), basename($relativePath), 'public');
            return;
        }

        if (!imageistruecolor($image)) {
            imagepalettetotruecolor($image);
        }

        if ($mime === 'image/png') {
            imagealphablending($image, true);
            imagesavealpha($image, true);
        }

        $width = imagesx($image);
        $height = imagesy($image);

        if ($width > $maxWidth) {
            $newWidth = $maxWidth;
            $newHeight = (int) round(($height / $width) * $newWidth);
            $resizedImage = imagecreatetruecolor($newWidth, $newHeight);

            if ($mime === 'image/png' || $mime === 'image/webp') {
                imagealphablending($resizedImage, false);
                imagesavealpha($resizedImage, true);
            }

            imagecopyresampled($resizedImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resizedImage;
        }

        $fullPath = Storage::disk('public')->path($relativePath);
        $dir = dirname($fullPath);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        imagewebp($image, $fullPath, $quality);
        imagedestroy($image);
    }
}

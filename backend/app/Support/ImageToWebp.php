<?php

namespace App\Support;

use RuntimeException;

/**
 * Convierte cualquier imagen subida al panel a WebP optimizado (ancho máx. 1600 px).
 *
 * Primero intenta con Imagick: lee también HEIC/HEIF (fotos de iPhone), AVIF, TIFF y BMP,
 * endereza las fotos de celular según su EXIF y conserva la transparencia. Si Imagick no
 * está o no puede, usa GD (JPG, PNG, WebP, GIF, BMP, AVIF). Si ninguno puede, lanza una
 * excepción: nunca se guarda el original con extensión .webp.
 *
 * No depende de Laravel (se puede probar con un script suelto).
 */
class ImageToWebp
{
    /** Formatos que se aceptan al subir (por extensión detectada del contenido). */
    public const ACCEPTED = ['jpg', 'jpeg', 'jpe', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif', 'avif', 'tif', 'tiff'];

    /**
     * Tipo real del archivo (por su contenido) → formato que se le indica a Imagick. Solo estos
     * se procesan: así Imagick nunca abre PDF/PS/SVG con delegados externos como Ghostscript.
     */
    private const FORMATS = [
        'image/jpeg' => 'JPEG',
        'image/png' => 'PNG',
        'image/webp' => 'WEBP',
        'image/gif' => 'GIF',
        'image/bmp' => 'BMP',
        'image/x-ms-bmp' => 'BMP',
        'image/heic' => 'HEIC',
        'image/heif' => 'HEIC',
        'image/heic-sequence' => 'HEIC',
        'image/heif-sequence' => 'HEIC',
        'image/avif' => 'AVIF',
        'image/tiff' => 'TIFF',
    ];

    public static function convert(string $sourcePath, string $destPath, int $quality = 82, int $maxWidth = 1600): void
    {
        $dir = dirname($destPath);
        if (! is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($sourcePath) ?: '';
        $format = self::FORMATS[$mime] ?? null;
        if ($format === null) {
            throw new RuntimeException('Formato de imagen no soportado: '.$mime);
        }

        if (class_exists(\Imagick::class) && self::withImagick($format.':'.$sourcePath, $destPath, $quality, $maxWidth)) {
            return;
        }
        if (self::withGd($sourcePath, $destPath, $quality, $maxWidth)) {
            return;
        }

        throw new RuntimeException('No se pudo procesar la imagen.');
    }

    private static function withImagick(string $src, string $dest, int $quality, int $maxWidth): bool
    {
        try {
            $im = new \Imagick();
            $im->readImage($src);
            // GIF animado / TIFF de varias páginas: alcanza con el primer cuadro.
            $im->setIteratorIndex(0);
            $frame = $im->getImage();
            $im->clear();

            // Fotos de celular: la cámara guarda la orientación en el EXIF en vez de girar los píxeles.
            $frame->autoOrient();
            if ($frame->getImageWidth() > $maxWidth) {
                $frame->resizeImage($maxWidth, 0, \Imagick::FILTER_LANCZOS, 1);
            }
            $frame->setImageFormat('webp');
            $frame->setImageCompressionQuality($quality);
            $frame->setOption('webp:method', '6');
            $frame->stripImage(); // sin EXIF/GPS: más liviano y no publica la ubicación de la foto

            $ok = $frame->writeImage($dest);
            $frame->clear();

            return $ok && self::isWebp($dest);
        } catch (\Throwable) {
            @unlink($dest);

            return false;
        }
    }

    private static function withGd(string $src, string $dest, int $quality, int $maxWidth): bool
    {
        $info = @getimagesize($src);
        $image = match ($info['mime'] ?? null) {
            'image/jpeg' => @imagecreatefromjpeg($src),
            'image/png' => @imagecreatefrompng($src),
            'image/webp' => @imagecreatefromwebp($src),
            'image/gif' => @imagecreatefromgif($src),
            'image/bmp', 'image/x-ms-bmp' => function_exists('imagecreatefrombmp') ? @imagecreatefrombmp($src) : false,
            'image/avif' => function_exists('imagecreatefromavif') ? @imagecreatefromavif($src) : false,
            default => false,
        };
        if (! $image) {
            return false;
        }

        if (! imageistruecolor($image)) {
            imagepalettetotruecolor($image);
        }
        imagealphablending($image, true);
        imagesavealpha($image, true);

        // GD no aplica la orientación EXIF sola.
        if (($info['mime'] ?? '') === 'image/jpeg' && function_exists('exif_read_data')) {
            $orientation = (int) (@exif_read_data($src)['Orientation'] ?? 1);
            $image = match ($orientation) {
                3 => imagerotate($image, 180, 0),
                6 => imagerotate($image, -90, 0),
                8 => imagerotate($image, 90, 0),
                default => $image,
            };
        }

        $width = imagesx($image);
        $height = imagesy($image);
        if ($width > $maxWidth) {
            $newHeight = (int) round(($height / $width) * $maxWidth);
            $resized = imagecreatetruecolor($maxWidth, $newHeight);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $maxWidth, $newHeight, $width, $height);
            imagedestroy($image);
            $image = $resized;
        }

        $ok = imagewebp($image, $dest, $quality);
        imagedestroy($image);

        return $ok && self::isWebp($dest);
    }

    private static function isWebp(string $path): bool
    {
        $head = @file_get_contents($path, false, null, 0, 12);

        return is_string($head) && strlen($head) === 12 && substr($head, 0, 4) === 'RIFF' && substr($head, 8, 4) === 'WEBP';
    }
}

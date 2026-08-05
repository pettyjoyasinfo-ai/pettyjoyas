// Removedor de fondo que corre 100% en el navegador (WASM/ONNX, sin servidor
// ni costo por imagen). La librería y su modelo (~40 MB) se cargan bajo demanda
// la primera vez (después queda cacheado por el navegador).

/**
 * Quita el fondo de una imagen y devuelve un PNG con transparencia.
 * @param file  Imagen original (Blob/File del input de archivos).
 * @param onProgress  Callback opcional con una etiqueta de progreso legible.
 */
export async function removeImageBackground(
  file: Blob,
  onProgress?: (label: string) => void,
): Promise<Blob> {
  const { removeBackground } = await import("@imgly/background-removal");

  return removeBackground(file, {
    output: { format: "image/png" },
    progress: (key: string, current: number, total: number) => {
      if (!onProgress) return;
      const pct = total ? Math.round((current / total) * 100) : 0;
      onProgress(
        key.startsWith("fetch")
          ? `Preparando (${pct}%)…`
          : `Quitando fondo (${pct}%)…`,
      );
    },
  });
}

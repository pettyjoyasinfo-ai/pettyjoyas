import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * El backend (Laravel) llama a este endpoint después de guardar un producto,
 * para que la página deje de esperar la ventana de caché ISR (revalidate=60)
 * y se actualice al instante. Sin esto, una edición podía tardar hasta un
 * minuto en verse reflejada — suficiente para parecer un bug.
 *
 * Si en algún momento se configura la variable de entorno REVALIDATE_SECRET
 * en Vercel, toma prioridad sobre este valor por defecto.
 */
const SECRET = process.env.REVALIDATE_SECRET || "67f19ca37c731262ea220194d67c3a98575454b623e405426e820fb92699f072";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || body.secret !== SECRET) {
    return NextResponse.json({ revalidated: false, message: "Secreto inválido" }, { status: 401 });
  }

  const paths: string[] = Array.isArray(body.paths)
    ? body.paths
    : typeof body.path === "string"
      ? [body.path]
      : [];

  if (paths.length === 0) {
    return NextResponse.json({ revalidated: false, message: "Falta path/paths" }, { status: 400 });
  }

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true, paths });
}

/**
 * Cliente HTTP de la API de Laravel.
 *
 * El frontend NUNCA accede a la base de datos: consume exclusivamente la API
 * REST vía HTTPS. Mientras el backend no esté disponible (modo demo en Vercel),
 * `NEXT_PUBLIC_API_URL` queda vacío y la app usa los mocks de `lib/data`.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * ⛔ INTERRUPTOR GLOBAL DEL BACKEND ⛔
 *
 * El cliente todavía está VALIDANDO EL DISEÑO, así que toda la lógica de backend
 * está DESACTIVADA: el frontend corre 100% con mocks (deploy a Vercel sin riesgos,
 * aunque exista NEXT_PUBLIC_API_URL).
 *
 * Para reactivar el backend cuando esté listo:
 *   1) poné  BACKEND_ENABLED = true
 *   2) configurá  NEXT_PUBLIC_API_URL=https://api.tu-dominio.com/api  (Vercel)
 * No hace falta tocar nada más: catálogo, React Query y sync offline se reconectan solos.
 */
export const BACKEND_ENABLED = true;

export function isApiConfigured(): boolean {
  return BACKEND_ENABLED && Boolean(API_URL);
}

/**
 * Laravel devuelve `{ message }` (abort/excepciones) o `{ message, errors }`
 * (Form Requests: errores de validación por campo). Preferimos ese mensaje
 * real al genérico "Error {status} en {path}" para que la UI explique la
 * causa (ej. "Stock insuficiente de X (disponible: 0).").
 */
function extractErrorMessage(details: unknown, status: number, path: string): string {
  if (details && typeof details === "object") {
    const body = details as { message?: string; errors?: Record<string, string[]> };
    if (body.errors) {
      const first = Object.values(body.errors)[0]?.[0];
      if (first) return first;
    }
    if (body.message) return body.message;
  }
  return `Error ${status} en ${path}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const GUEST_CART_TOKEN_KEY = "petty-guest-cart-token";

/**
 * Identifica el carrito de alguien sin sesión ante el backend (reserva de
 * stock para invitados). Se genera una sola vez por navegador y se persiste
 * en localStorage; no es un dato sensible (equivalente a una cookie de sesión).
 */
export function getOrCreateGuestCartToken(): string | null {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem(GUEST_CART_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
  }
  return token;
}

type FetchOptions = RequestInit & {
  /** Token Bearer de Laravel Sanctum (cuando hay sesión). */
  token?: string | null;
};

/** Wrapper tipado de `fetch` contra la API de Laravel. */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, "NEXT_PUBLIC_API_URL no está configurada (modo mock).");
  }

  const { token, headers, ...rest } = options;
  // Si token es undefined (no pasado), lee petty-token. Si es null, sin bearer.
  const bearer =
    token !== undefined
      ? token
      : (typeof window !== "undefined" ? localStorage.getItem("petty-token") : null);
  // Carrito de invitado: el backend lo usa cuando no hay Bearer token. Mandarlo
  // siempre es inofensivo (se ignora en endpoints que no son de carrito).
  const guestCartToken = getOrCreateGuestCartToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    // 8-second timeout so server components don't hang when the backend is down
    signal: rest.signal ?? AbortSignal.timeout(8000),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(guestCartToken ? { "X-Guest-Cart-Token": guestCartToken } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let details: unknown = null;
    try {
      details = await res.json();
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    throw new ApiError(res.status, extractErrorMessage(details, res.status, path), details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const ADMIN_TOKEN_KEY = "petty-admin-token";

/** Igual que apiFetch pero usa el token del panel admin (petty-admin-token). */
export async function adminApiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
  return apiFetch<T>(path, { ...options, token: adminToken });
}

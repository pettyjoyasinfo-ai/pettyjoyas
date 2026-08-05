import { apiFetch, adminApiFetch } from "@/lib/api/client";
import type { AuthUser } from "@/lib/auth/store";

type AuthResponse = { user: AuthUser; token: string };

export function apiLogin(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function apiRegister(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  birthday?: string;
}) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Login con el ID token (credential) de Google Identity Services. */
export function apiGoogle(credential: string) {
  return apiFetch<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export function apiMe() {
  return apiFetch<AuthUser>("/auth/me");
}

/** Logout del cliente (tienda). Usa el token petty-token. */
export function apiLogout() {
  return apiFetch("/auth/logout", { method: "POST" }).catch(() => null);
}

/**
 * Logout del panel admin. Usa el token petty-admin-token (adminApiFetch) —
 * antes esta pantalla llamaba a apiLogout(), que manda el token de CLIENTE
 * (casi siempre inexistente para una cuenta staff), así que el pedido de
 * logout no llevaba ningún Bearer real: el backend nunca revocaba el token
 * de Sanctum de esa sesión, solo se borraba localStorage. El token viejo
 * seguía siendo válido en el servidor indefinidamente.
 */
export function apiAdminLogout() {
  return adminApiFetch("/auth/logout", { method: "POST" }).catch(() => null);
}

export function apiAcceptInvitation(data: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}) {
  return apiFetch<AuthResponse>("/auth/accept-invitation", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function apiResendInvitation(email: string) {
  return apiFetch<{ message: string }>("/auth/resend-invitation", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

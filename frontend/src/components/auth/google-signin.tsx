"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGoogle } from "@/lib/api/auth";
import { useAuth, useAdminAuth } from "@/lib/auth/store";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const GSI_SRC = "https://accounts.google.com/gsi/client";

declare global {
  interface Window {
    google?: any;
  }
}

/** Botón "Continuar con Google" usando Google Identity Services (ID token). */
export function GoogleSignin({ redirectTo }: { redirectTo?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setAuth = useAuth((s) => s.setAuth);
  const setAdminAuth = useAdminAuth((s) => s.setAuth);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!CLIENT_ID) return;

    function init() {
      if (!window.google || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            const { user, token } = await apiGoogle(response.credential);
            if (user.isStaff) {
              setAdminAuth(user, token);
            } else {
              setAuth(user, token);
            }
            router.push(redirectTo ?? (user.isStaff ? "/admin" : "/mi-cuenta"));
            router.refresh();
          } catch {
            setError("No pudimos iniciar sesión con Google.");
          }
        },
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        width: 360,
        text: "continue_with",
        locale: "es",
      });
    }

    if (window.google) {
      init();
    } else {
      const s = document.createElement("script");
      s.src = GSI_SRC;
      s.async = true;
      s.onload = init;
      document.head.appendChild(s);
    }
  }, [router, setAuth, redirectTo]);

  if (!CLIENT_ID) {
    return (
      <div className="rounded-full border border-dashed border-line px-6 py-3 text-center text-xs text-muted">
        Configurá <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> para habilitar Google
      </div>
    );
  }

  return (
    <div>
      <div ref={ref} className="flex justify-center" />
      {error && <p className="mt-2 text-center text-xs text-brand">{error}</p>}
    </div>
  );
}

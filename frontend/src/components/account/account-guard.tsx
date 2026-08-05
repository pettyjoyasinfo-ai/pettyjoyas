"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/store";
import { LoadingScreen } from "@/components/ui/spinner";

/** Exige sesión iniciada para el área "Mi cuenta". */
export function AccountGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, hydrated } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/cuenta?next=/mi-cuenta");
    else if (user.isStaff) router.replace("/admin");
  }, [hydrated, user, router]);

  if (!hydrated) return <LoadingScreen />;
  if (!user || user.isStaff) return <LoadingScreen label="Redirigiendo…" />;

  return <>{children}</>;
}

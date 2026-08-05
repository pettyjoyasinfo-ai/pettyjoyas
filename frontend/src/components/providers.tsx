"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CartSync } from "@/components/cart/cart-sync";

/** Proveedores globales del cliente: React Query + registro de Service Worker (PWA). */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registro opcional */
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CartSync />
      {children}
    </QueryClientProvider>
  );
}

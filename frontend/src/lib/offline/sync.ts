"use client";

import { adminApiFetch, isApiConfigured } from "@/lib/api/client";
import { getPendingEvents, updateEvent } from "@/lib/offline/db";

let syncing = false;

/** Envía todos los eventos pendientes al backend en un solo lote. Idempotente por UUID. */
export async function syncOutbox(): Promise<{ synced: number; failed: number }> {
  if (!isApiConfigured() || syncing || (typeof navigator !== "undefined" && !navigator.onLine)) {
    return { synced: 0, failed: 0 };
  }
  syncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pending = await getPendingEvents();
    if (pending.length === 0) return { synced: 0, failed: 0 };

    // Marca todos como "syncing" antes de enviar
    for (const e of pending) await updateEvent({ ...e, status: "syncing" });

    const res = await adminApiFetch<{ results: Array<{ id: string; status: string; message?: string }> }>(
      "/sync/events",
      {
        method: "POST",
        body: JSON.stringify({
          events: pending.map(e => ({
            id: e.id,
            type: e.type,
            payload: e.payload,
            created_at: e.createdAt,
          })),
        }),
      }
    );

    for (const event of pending) {
      const result = res.results?.find(r => r.id === event.id);
      if (result?.status === "accepted" || result?.status === "duplicate") {
        await updateEvent({ ...event, status: "synced" });
        synced++;
      } else {
        await updateEvent({
          ...event,
          status: "error",
          attempts: event.attempts + 1,
          lastError: result?.message ?? "error desconocido",
        });
        failed++;
      }
    }
  } catch (err) {
    // Si falla la red, revertimos a "pending" para reintentar
    const pending = await getPendingEvents();
    for (const e of pending) {
      if (e.status === "syncing") {
        await updateEvent({ ...e, status: "pending" });
      }
    }
    failed++;
  } finally {
    syncing = false;
  }

  return { synced, failed };
}

/** Registra listener para sincronizar automáticamente al recuperar conexión. */
export function startAutoSync(): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => void syncOutbox();
  window.addEventListener("online", handler);
  void syncOutbox(); // intento inicial para eventos de sesión previa
  return () => window.removeEventListener("online", handler);
}

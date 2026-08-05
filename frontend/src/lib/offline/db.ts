"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * Almacenamiento offline (IndexedDB).
 *
 * Filosofía (ver backend/ARCHITECTURE.md): NO se sincronizan bases de datos, se
 * sincronizan EVENTOS DE NEGOCIO. La app encola eventos en el "outbox" y, cuando
 * vuelve la conexión, se envían a la API de Laravel en orden. El stock y las
 * ventas se derivan de estos eventos (event sourcing liviano).
 */

export type BusinessEventType =
  | "SALE_CREATED"
  | "STOCK_ADJUSTED"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "INVENTORY_COUNT";

export type BusinessEvent = {
  /** UUID generado en el cliente (idempotencia en el backend). */
  id: string;
  type: BusinessEventType;
  payload: unknown;
  createdAt: number;
  /** "pending" | "syncing" | "synced" | "error" */
  status: "pending" | "syncing" | "synced" | "error";
  attempts: number;
  lastError?: string;
};

interface PettyDB extends DBSchema {
  outbox: {
    key: string;
    value: BusinessEvent;
    indexes: { "by-status": string; "by-createdAt": number };
  };
  /** Cache de catálogo para lectura offline. */
  cache: {
    key: string;
    value: { key: string; data: unknown; updatedAt: number };
  };
}

let dbPromise: Promise<IDBPDatabase<PettyDB>> | null = null;

export function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB solo está disponible en el navegador.");
  }
  if (!dbPromise) {
    dbPromise = openDB<PettyDB>("petty-joyas", 1, {
      upgrade(db) {
        const outbox = db.createObjectStore("outbox", { keyPath: "id" });
        outbox.createIndex("by-status", "status");
        outbox.createIndex("by-createdAt", "createdAt");
        db.createObjectStore("cache", { keyPath: "key" });
      },
    });
  }
  return dbPromise;
}

/** Encola un evento de negocio para sincronizar luego. */
export async function enqueueEvent(
  type: BusinessEventType,
  payload: unknown,
): Promise<BusinessEvent> {
  const db = await getDB();
  const event: BusinessEvent = {
    id: crypto.randomUUID(),
    type,
    payload,
    createdAt: Date.now(),
    status: "pending",
    attempts: 0,
  };
  await db.add("outbox", event);
  return event;
}

export async function getPendingEvents(): Promise<BusinessEvent[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("outbox", "by-createdAt");
  return all.filter((e) => e.status === "pending" || e.status === "error");
}

export async function updateEvent(event: BusinessEvent): Promise<void> {
  const db = await getDB();
  await db.put("outbox", event);
}

export async function countPending(): Promise<number> {
  return (await getPendingEvents()).length;
}

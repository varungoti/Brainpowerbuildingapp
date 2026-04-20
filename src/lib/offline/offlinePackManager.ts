import type { Activity } from "../../app/data/activities";

export interface OfflinePack {
  id: string;
  childId: string;
  generatedAt: string;
  expiresAt: string;
  activities: Activity[];
}

export interface SyncQueueItem {
  id: string;
  type: "log" | "analytics" | "rating";
  payload: unknown;
  createdAt: string;
  retryCount: number;
}

const DB_NAME = "neurospark-offline";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("packs")) {
        db.createObjectStore("packs", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePack(pack: OfflinePack): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("packs", "readwrite");
    tx.objectStore("packs").put(pack);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPack(childId: string): Promise<OfflinePack | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("packs", "readonly");
    const store = tx.objectStore("packs");
    const req = store.getAll();
    req.onsuccess = () => {
      const packs = req.result as OfflinePack[];
      const now = Date.now();
      const valid = packs
        .filter(p => p.childId === childId && new Date(p.expiresAt).getTime() > now)
        .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
      resolve(valid[0] ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount">): Promise<void> {
  const db = await openDB();
  const entry: SyncQueueItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    tx.objectStore("syncQueue").put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function flushSyncQueue(edgeBaseUrl: string): Promise<number> {
  const db = await openDB();
  const items: SyncQueueItem[] = await new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readonly");
    const req = tx.objectStore("syncQueue").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  let flushed = 0;
  for (const item of items) {
    try {
      const resp = await fetch(`${edgeBaseUrl}/${item.type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      if (resp.ok) {
        const delTx = db.transaction("syncQueue", "readwrite");
        delTx.objectStore("syncQueue").delete(item.id);
        flushed++;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return flushed;
}

export async function getSyncQueueSize(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("syncQueue", "readonly");
      const req = tx.objectStore("syncQueue").count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return 0;
  }
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

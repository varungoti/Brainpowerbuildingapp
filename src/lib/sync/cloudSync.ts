// ============================================================================
// cloudSync — debounced state push/pull against Supabase /sync/state
// ----------------------------------------------------------------------------
// • POST /sync/state  { state, version, deviceId } → { version, conflict }
// • GET  /sync/state                                 → { state, version }
//
// The Edge Function is content-agnostic: it stores whatever JSON blob the
// client sends, keyed by user id. Conflict detection uses an opaque version
// counter incremented server-side on every write.
//
// This file is intentionally transport-only — the AppContext owns when to
// pull/push and how to reconcile, so we can swap CRDTs in later without
// touching UI.
// ============================================================================

import { captureProductEvent } from "../../utils/productAnalytics";
import { functionsBaseUrl, publicAnonKey } from "../../utils/supabase/info";

const FUNCTIONS_BASE = functionsBaseUrl;

export interface SyncResult {
  ok: boolean;
  version?: number;
  conflict?: boolean;
  errorMessage?: string;
}

export interface PullResult {
  ok: boolean;
  state?: unknown;
  version?: number;
  errorMessage?: string;
}

function deviceId(): string {
  try {
    let id = localStorage.getItem("neurospark_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("neurospark_device_id", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function authHeader(jwt: string | null): Record<string, string> {
  return { Authorization: `Bearer ${jwt ?? publicAnonKey}` };
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
const PUSH_DEBOUNCE_MS = 4000;

export function pushStateDebounced(state: unknown, jwt: string | null, onResult?: (r: SyncResult) => void) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    pushTimer = null;
    const result = await pushStateNow(state, jwt);
    onResult?.(result);
  }, PUSH_DEBOUNCE_MS);
}

export async function pushStateNow(state: unknown, jwt: string | null): Promise<SyncResult> {
  try {
    const body = JSON.stringify({ state, deviceId: deviceId() });
    const kb = Math.round(body.length / 1024);
    const resp = await fetch(`${FUNCTIONS_BASE}/sync/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(jwt) },
      body,
    });
    if (!resp.ok) {
      return { ok: false, errorMessage: `HTTP ${resp.status}` };
    }
    const json = (await resp.json()) as { version?: number; conflict?: boolean };
    captureProductEvent("cloud_sync_push", {
      payload_kb: kb,
      conflict_count: json.conflict ? 1 : 0,
    });
    return { ok: true, version: json.version, conflict: !!json.conflict };
  } catch (e) {
    return { ok: false, errorMessage: (e as Error).message };
  }
}

export async function pullState(jwt: string | null): Promise<PullResult> {
  try {
    const resp = await fetch(`${FUNCTIONS_BASE}/sync/state`, {
      method: "GET",
      headers: { ...authHeader(jwt) },
    });
    if (!resp.ok) return { ok: false, errorMessage: `HTTP ${resp.status}` };
    const json = (await resp.json()) as { state?: unknown; version?: number };
    captureProductEvent("cloud_sync_pull", {});
    return { ok: true, state: json.state, version: json.version };
  } catch (e) {
    return { ok: false, errorMessage: (e as Error).message };
  }
}

const LS_ENABLED = "neurospark_cloud_sync_enabled";

export function isCloudSyncEnabled(): boolean {
  try {
    return localStorage.getItem(LS_ENABLED) === "1";
  } catch {
    return false;
  }
}

export function setCloudSyncEnabled(v: boolean) {
  try {
    localStorage.setItem(LS_ENABLED, v ? "1" : "0");
    if (v) captureProductEvent("cloud_sync_enable", {});
  } catch {
    /* private mode */
  }
}

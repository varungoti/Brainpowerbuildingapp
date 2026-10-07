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
// An explicit opt-out must remain effective in this session even if storage
// still contains an old opt-in because its write failed.
let cloudSyncRevokedForSession = false;
let consentGeneration = 0;

export interface CloudSyncOperation {
  readonly consentGeneration: number;
}

/** Capture before any asynchronous session lookup or snapshot preparation. */
export function captureCloudSyncOperation(): CloudSyncOperation | null {
  return isCloudSyncEnabled() ? { consentGeneration } : null;
}

function operationError(operation: CloudSyncOperation | null): string | null {
  if (!isCloudSyncEnabled()) return "Cloud sync is disabled";
  if (!operation || operation.consentGeneration !== consentGeneration) return "Cloud sync consent has changed";
  return null;
}

function cancelPendingPush() {
  if (pushTimer !== null) clearTimeout(pushTimer);
  pushTimer = null;
}

export function pushStateDebounced(state: unknown, jwt: string | null, operation: CloudSyncOperation | null, onResult?: (r: SyncResult) => void) {
  // A stale caller must not cancel a newer, authorized caller's queued work.
  if (operationError(operation)) return;
  cancelPendingPush();
  pushTimer = setTimeout(async () => {
    pushTimer = null;
    if (operationError(operation)) return;
    const result = await pushStateNow(state, jwt, operation);
    onResult?.(result);
  }, PUSH_DEBOUNCE_MS);
}

export async function pushStateNow(state: unknown, jwt: string | null, operation: CloudSyncOperation | null): Promise<SyncResult> {
  const denied = operationError(operation);
  if (denied) return { ok: false, errorMessage: denied };
  try {
    const body = JSON.stringify({ state, deviceId: deviceId() });
    const kb = Math.round(body.length / 1024);
    // Recheck at the network boundary, including manual calls resumed after
    // session lookup and state serialization that may revoke consent.
    const consentChanged = operationError(operation);
    if (consentChanged) return { ok: false, errorMessage: consentChanged };
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

export async function pullState(jwt: string | null, operation: CloudSyncOperation | null): Promise<PullResult> {
  const denied = operationError(operation);
  if (denied) return { ok: false, errorMessage: denied };
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
  if (cloudSyncRevokedForSession) return false;
  try {
    return localStorage.getItem(LS_ENABLED) === "1";
  } catch {
    return false;
  }
}

export function setCloudSyncEnabled(v: boolean) {
  if (!v) {
    cloudSyncRevokedForSession = true;
    consentGeneration += 1;
    // Only pending work can be canceled; a request already handed to fetch
    // may have reached the server and cannot be recalled by this preference.
    cancelPendingPush();
  }
  try {
    localStorage.setItem(LS_ENABLED, v ? "1" : "0");
    if (v) cloudSyncRevokedForSession = false;
    if (v) captureProductEvent("cloud_sync_enable", {});
  } catch {
    /* private mode */
  }
}

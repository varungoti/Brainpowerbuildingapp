// ============================================================================
// PostHog HTTP forwarder (zero-dependency)
// ----------------------------------------------------------------------------
// PostHog supports a documented capture endpoint that accepts a JSON batch:
//   POST {host}/i/v0/e/   (or {host}/capture/)
// We use the batch path so a single network round-trip can drain a flush of
// product analytics events. We never load posthog-js here so the bundle stays
// lean — fine for our funnel/quality use case (no autocapture, no replays).
//
// Activation requires THREE conditions to all be true:
//   1. import.meta.env.PROD  — never fire in dev/test
//   2. VITE_POSTHOG_KEY      — project API key present
//   3. The `posthog` flag is enabled in VITE_FEATURE_FLAGS — so deployments
//      can toggle PostHog on/off without redeploying app code.
//
// Privacy: we never set $set / $set_once user properties beyond a stable
// anonymous distinct_id (random uuid persisted to localStorage). Same
// privacy-light contract as productAnalytics.ts — no child names, emails,
// raw DOB, or supabase user ids are forwarded.
// ============================================================================

import type { ProductEventPayload } from "./productAnalytics";
import { isFeatureEnabled } from "./featureFlags";

const STORAGE_KEY = "neurospark.posthog.distinct_id";
const DEFAULT_HOST = "https://us.i.posthog.com";
const DEFAULT_PATH = "/i/v0/e/";

let cachedHost: string | null = null;
let cachedKey: string | null = null;
let cachedDistinctId: string | null = null;
let cachedActive: boolean | null = null;

function readEnvKey(): string | null {
  const v = (import.meta.env as Record<string, string | undefined>).VITE_POSTHOG_KEY;
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function readEnvHost(): string {
  const v = (import.meta.env as Record<string, string | undefined>).VITE_POSTHOG_HOST;
  return typeof v === "string" && v.trim().length > 0 ? v.trim().replace(/\/+$/, "") : DEFAULT_HOST;
}

/**
 * Vite injects `import.meta.env.PROD` as a real boolean at build time, but
 * `vi.stubEnv("PROD", "false")` in tests turns it into the *string* "false"
 * (which is truthy). Treat both shapes as the same intent.
 */
function isProductionBuild(): boolean {
  const raw = (import.meta.env as Record<string, unknown>).PROD;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") return raw === "true";
  return false;
}

function generateDistinctId(): string {
  // Native crypto.randomUUID where available; fall back to a Math.random
  // composition that's still 122 bits of entropy split across two halves.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const a = Math.random().toString(16).slice(2, 18).padEnd(16, "0");
  const b = Math.random().toString(16).slice(2, 18).padEnd(16, "0");
  return `${a}-${b}`;
}

function readDistinctId(): string {
  if (cachedDistinctId) return cachedDistinctId;
  if (typeof localStorage === "undefined") {
    cachedDistinctId = generateDistinctId();
    return cachedDistinctId;
  }
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length > 0) {
      cachedDistinctId = existing;
      return existing;
    }
    const fresh = generateDistinctId();
    localStorage.setItem(STORAGE_KEY, fresh);
    cachedDistinctId = fresh;
    return fresh;
  } catch {
    // Private mode / quota exceeded — fine, just don't persist.
    cachedDistinctId = generateDistinctId();
    return cachedDistinctId;
  }
}

/**
 * Returns true iff PostHog forwarding is currently active. Cached after the
 * first call within a session — `__resetPostHogForwarderForTests` clears it.
 */
export function isPostHogActive(): boolean {
  if (cachedActive !== null) return cachedActive;
  const inProd = isProductionBuild();
  const key = readEnvKey();
  const flagOn = isFeatureEnabled("posthog");
  cachedActive = inProd && key !== null && flagOn;
  if (cachedActive) {
    cachedKey = key;
    cachedHost = readEnvHost();
  }
  return cachedActive;
}

/**
 * Forward a batch of NeuroSpark product events to PostHog. No-op when
 * `isPostHogActive()` is false. Never throws to callers.
 *
 * Each event is mapped to PostHog's wire format:
 *   { event, properties, timestamp, distinct_id }
 *
 * The full NeuroSpark payload (utm_*, ns_*, all coarse dimensions) is copied
 * verbatim into `properties` so PostHog dashboards can pivot on them
 * without any post-processing.
 */
export function forwardEventsToPostHog(events: ProductEventPayload[]): void {
  if (events.length === 0) return;
  if (!isPostHogActive() || !cachedKey || !cachedHost) return;

  const distinct_id = readDistinctId();
  const url = `${cachedHost}${DEFAULT_PATH}`;
  const batch = events.map((evt) => {
    const { event, ts, ...properties } = evt;
    return {
      event,
      timestamp: ts,
      distinct_id,
      properties: {
        ...properties,
        $lib: "neurospark-web",
        $lib_version: (import.meta.env as Record<string, string | undefined>).VITE_APP_VERSION ?? "0.0.0",
      },
    };
  });

  const body = JSON.stringify({
    api_key: cachedKey,
    batch,
  });

  try {
    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* swallow — analytics must never crash the app */
  }
}

/** Test hook — drops cached state so subsequent calls re-evaluate the env. */
export function __resetPostHogForwarderForTests(): void {
  cachedHost = null;
  cachedKey = null;
  cachedDistinctId = null;
  cachedActive = null;
}

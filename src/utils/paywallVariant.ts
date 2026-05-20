/**
 * Paywall A/B variant client helper.
 *
 * Companion to `productAnalytics.ts` and the server-side
 * `/growth/paywall/assign` endpoint. Responsibilities:
 *   1. On first paywall view, ask the server which variant this device should
 *      see (server hashes the actor + bucketizes by allocation_pct).
 *   2. Cache the assignment in localStorage so refreshes are sticky and
 *      offline reloads don't reshuffle.
 *   3. Expose the assigned variant_key to the rest of the app so paywall
 *      copy/price overrides + analytics events can attribute correctly.
 *
 * Privacy: we never send the user's email, name, or auth token. The
 * server identifies actors via x-actor-id (a per-device stable random id we
 * generate locally) hashed with a server-side pepper.
 */
import { functionsBaseUrl, publicAnonKey } from "./supabase/info";

const STORAGE_KEY = "ns:paywall_variant";
const ACTOR_KEY = "ns:actor_id";
const FETCH_TIMEOUT_MS = 4000;

export interface PaywallVariant {
  variant_key: string;
  name: string;
  headline?: string | null;
  sub_copy?: string | null;
  price_label?: string | null;
  plan_id?: string | null;
}

interface CachedAssignment {
  variant: PaywallVariant;
  assignedAt: number;
}

let inFlight: Promise<PaywallVariant | null> | null = null;

function getActorId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(ACTOR_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).slice(0, 64);
      window.localStorage.setItem(ACTOR_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function readCached(): CachedAssignment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedAssignment;
    if (!parsed?.variant?.variant_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCached(variant: PaywallVariant): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ variant, assignedAt: Date.now() } satisfies CachedAssignment));
  } catch {
    /* non-fatal */
  }
}

/**
 * Returns the paywall variant for this device. Reads cache synchronously
 * if available; otherwise hits the server. Always returns null on error
 * so callers can render their default copy.
 */
export async function getPaywallVariant(): Promise<PaywallVariant | null> {
  const cached = readCached();
  if (cached) return cached.variant;
  if (!functionsBaseUrl || !publicAnonKey) return null;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctl && setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
    try {
      const resp = await fetch(`${functionsBaseUrl}/growth/paywall/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
          "x-actor-id": getActorId(),
        },
        body: "{}",
        signal: ctl?.signal,
      });
      if (!resp.ok) return null;
      const data = (await resp.json()) as { variant: PaywallVariant | null };
      if (data.variant?.variant_key) {
        writeCached(data.variant);
        return data.variant;
      }
      return null;
    } catch {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * Synchronous accessor — returns whatever's cached from a prior await of
 * getPaywallVariant(). Use to attribute analytics events that fire
 * synchronously (e.g. button click handlers) without re-fetching.
 */
export function getCachedPaywallVariantKey(): string | null {
  return readCached()?.variant.variant_key ?? null;
}

/**
 * Test/admin helper — clears the cached assignment so the next paywall view
 * will re-fetch from the server.
 */
export function clearPaywallVariant(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* non-fatal */
  }
}

/**
 * Attaches the actor id to outbound analytics fetches. Called by the batched
 * sink in productAnalytics.ts so the server can join events back to the
 * actor that produced them. Surfaced as a function (not a constant) because
 * the actor id is initialized lazily on first DOM access.
 */
export function actorIdHeader(): Record<string, string> {
  return { "x-actor-id": getActorId() };
}

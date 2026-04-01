import { functionsBaseUrl, isSupabaseConfigured, publicAnonKey } from "./supabase/info";

/** Shape returned by Edge Function GET .../remote-config */
export type RemoteAppFlags = {
  payments_remote_kill?: boolean;
  ai_counselor_paused?: boolean;
};

const DEFAULT_FLAGS: RemoteAppFlags = {};
const TTL_MS = 90_000;

let cache: RemoteAppFlags = DEFAULT_FLAGS;
let fetchedAt = 0;
let inFlight: Promise<RemoteAppFlags> | null = null;

/**
 * Fetches non-secret feature flags from the deployed Edge Function.
 * Cached ~90s; safe to call often. Returns {} if Supabase is not configured or fetch fails.
 */
export async function fetchRemoteAppFlags(): Promise<RemoteAppFlags> {
  if (!isSupabaseConfigured() || !functionsBaseUrl) {
    return DEFAULT_FLAGS;
  }
  const now = Date.now();
  if (fetchedAt > 0 && now - fetchedAt < TTL_MS) {
    return cache;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const url = `${functionsBaseUrl}/remote-config`;
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${publicAnonKey}` },
        cache: "no-store",
      });
      if (!res.ok) return cache;
      const data = (await res.json()) as { ok?: boolean; flags?: RemoteAppFlags };
      if (!data.ok || !data.flags || typeof data.flags !== "object") return cache;
      cache = { ...data.flags };
      fetchedAt = Date.now();
      return cache;
    } catch {
      return cache;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

export function peekCachedRemoteFlags(): RemoteAppFlags {
  return cache;
}

export function clearRemoteAppConfigCache(): void {
  cache = DEFAULT_FLAGS;
  fetchedAt = 0;
}

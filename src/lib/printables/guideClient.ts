import { buildPrintableGuideFallback } from "./guideFallback";
import type { PrintableGuide, PrintableGuideRequest } from "./guideTypes";
import { isPrintableRecord, printableGuidePayload, printableGuideRequestIdentity, validatePrintableGuide } from "./guideValidation";
import { functionsBaseUrl } from "../../utils/supabase/info";

// Printable requests contain child context. Do not persist their identity or
// generated content. A caller must supply an ephemeral owner/child scope to
// reuse one guide, for at most five minutes and never across a page reload.
const CACHE_TTL_MS = 5 * 60 * 1000;
declare const scopeBrand: unique symbol;
export type PrintableGuideCacheScope = { readonly [scopeBrand]: true };
type CacheState = {
  entry?: { identity: string; guide: PrintableGuide; expiresAt: number };
  timer?: ReturnType<typeof setTimeout>;
  latestRequest?: symbol;
};
const scopes = new WeakMap<PrintableGuideCacheScope, CacheState>();

export function createPrintableGuideCacheScope(): PrintableGuideCacheScope {
  const scope = Object.freeze({}) as PrintableGuideCacheScope;
  scopes.set(scope, {});
  return scope;
}

/** Call on owner/child changes or unmount; pending completions cannot refill it. */
export function clearPrintableGuideCache(scope: PrintableGuideCacheScope): void {
  const state = scopes.get(scope);
  if (!state) return;
  if (state.timer !== undefined) clearTimeout(state.timer);
  state.timer = undefined;
  state.entry = undefined;
  state.latestRequest = undefined;
}

export function getCachedPrintableGuide(req: PrintableGuideRequest, scope?: PrintableGuideCacheScope): PrintableGuide | null {
  const state = scope ? scopes.get(scope) : undefined;
  if (!state?.entry) return null;
  const entry = state.entry;
  if (entry.expiresAt <= Date.now()) {
    // Expiration must not cancel a newer request already in flight.
    if (state.timer !== undefined) clearTimeout(state.timer);
    state.timer = undefined;
    state.entry = undefined;
    return null;
  }
  if (entry.identity !== printableGuideRequestIdentity(req)) return null;
  return validatePrintableGuide(entry.guide, req);
}

export function cachePrintableGuide(req: PrintableGuideRequest, guide: PrintableGuide, scope?: PrintableGuideCacheScope): void {
  const state = scope ? scopes.get(scope) : undefined;
  if (!state) return;
  const safeGuide = validatePrintableGuide(guide, req);
  if (!safeGuide) return;
  if (state.timer !== undefined) clearTimeout(state.timer);
  state.entry = { identity: printableGuideRequestIdentity(req), guide: safeGuide, expiresAt: Date.now() + CACHE_TTL_MS };
  state.latestRequest = undefined;
  state.timer = setTimeout(() => {
    state.entry = undefined;
    state.timer = undefined;
  }, CACHE_TTL_MS);
}

export async function createPrintableGuide(req: PrintableGuideRequest, scope?: PrintableGuideCacheScope): Promise<PrintableGuide> {
  // Callers can change their pack while fetch is pending. Keep the response,
  // fallback and cache write tied to the request actually sent.
  const request = structuredClone(req);
  if (!request.forceRefresh) {
    const cached = getCachedPrintableGuide(request, scope);
    if (cached) return cached;
  }

  const state = scope ? scopes.get(scope) : undefined;
  const generation = Symbol();
  if (state) state.latestRequest = generation;
  const remember = (guide: PrintableGuide) => {
    // Last-started request wins across all identities in this owner/child scope.
    // Each caller still receives its own result; UI cancellation is separate.
    if (state?.latestRequest === generation) cachePrintableGuide(request, guide, scope);
    return guide;
  };
  const fallback = buildPrintableGuideFallback(request);
  try {
    const res = await fetch(`${functionsBaseUrl.replace("/make-server-76b0ba9a", "")}/printable/guide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(printableGuidePayload(request)),
    });
    if (!res.ok) return remember(fallback);
    const json: unknown = await res.json();
    const guide = isPrintableRecord(json) && json.success === true
      ? validatePrintableGuide(json.guide, request) ?? fallback
      : fallback;
    return remember(guide);
  } catch {
    return remember(fallback);
  }
}

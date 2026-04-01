/**
 * Comma- or space-separated feature toggles from VITE_FEATURE_FLAGS (build-time).
 * Example: VITE_FEATURE_FLAGS=ai_counselor,experimental_paywall
 * Use for gradual rollout without app-store delay; defaults to all flags off (empty set).
 */
export function parseFeatureFlagsString(raw: string | undefined): Set<string> {
  const s = raw?.trim() ?? "";
  if (!s) return new Set();
  return new Set(
    s
      .split(/[\s,]+/)
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function parseFeatureFlags(): Set<string> {
  return parseFeatureFlagsString(import.meta.env.VITE_FEATURE_FLAGS);
}

let cached: Set<string> | null = null;
function getFlags(): Set<string> {
  if (!cached) cached = parseFeatureFlags();
  return cached;
}

/** Returns true only if the flag is explicitly listed in VITE_FEATURE_FLAGS. */
export function isFeatureEnabled(flag: string): boolean {
  return getFlags().has(flag.trim().toLowerCase());
}

/**
 * When flag `payments_remote_kill` is set, treat checkout as disabled (same UX as missing Supabase).
 * Use if you need to halt payments from env without redeploying paywall logic.
 */
export function isPaymentsRemotelyDisabled(): boolean {
  return isFeatureEnabled("payments_remote_kill");
}

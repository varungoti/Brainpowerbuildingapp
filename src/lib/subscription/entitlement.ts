// ============================================================================
// entitlement — single source of truth for premium state
// ----------------------------------------------------------------------------
// The web app today computes premium client-side from credits/payment receipts.
// This module wraps the server contract so iOS/Android (and a future re-keyed
// web check) can rely on the same shape:
//
//   GET /billing/entitlement → { isActive, plan, expiresAt, source }
//
// Native restorePurchases() lives behind a Capacitor plugin (NeuroSparkBilling)
// that we stub here — the same way nativeVoiceAdapter degrades to web.
// ============================================================================

import { functionsBaseUrl, publicAnonKey } from "../../utils/supabase/info";
import { getSupabaseBrowserClient } from "../../utils/supabase/client";

export interface Entitlement {
  isActive: boolean;
  plan: string | null;
  expiresAt: string | null;
  source: "razorpay" | "ios" | "android" | "promo" | null;
}

const FALLBACK: Entitlement = { isActive: false, plan: null, expiresAt: null, source: null };

async function getJwt(): Promise<string | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function fetchEntitlement(): Promise<Entitlement> {
  if (!functionsBaseUrl) return FALLBACK;
  const jwt = await getJwt();
  if (!jwt) return FALLBACK;
  try {
    const resp = await fetch(`${functionsBaseUrl.replace("/make-server-76b0ba9a", "")}/billing/entitlement`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: publicAnonKey,
      },
    });
    if (!resp.ok) return FALLBACK;
    const json = (await resp.json()) as Partial<Entitlement>;
    return {
      isActive: !!json.isActive,
      plan: json.plan ?? null,
      expiresAt: json.expiresAt ?? null,
      source: json.source ?? null,
    };
  } catch {
    return FALLBACK;
  }
}

// ─── Native restore-purchases shim (Capacitor plugin contract) ───────────────
interface CapacitorBridge {
  isNativePlatform?: () => boolean;
  Plugins?: { NeuroSparkBilling?: NeuroSparkBillingPlugin };
}
interface NeuroSparkBillingPlugin {
  restorePurchases(): Promise<{ ok: boolean; receipts: Array<{ productId: string; expiresAt?: string }> }>;
}

function getCap(): CapacitorBridge | null {
  const w = typeof window !== "undefined" ? (window as unknown as { Capacitor?: CapacitorBridge }) : null;
  return w?.Capacitor ?? null;
}

export async function restorePurchases(): Promise<{ ok: boolean; entitlement?: Entitlement; reason?: string }> {
  const cap = getCap();
  const plugin = cap?.Plugins?.NeuroSparkBilling;
  if (!cap?.isNativePlatform?.() || !plugin) {
    return { ok: false, reason: "not_supported_on_web" };
  }
  try {
    const result = await plugin.restorePurchases();
    if (!result.ok) return { ok: false, reason: "store_returned_no_receipts" };
    // Receipts would normally be POSTed to /billing/restore for verification;
    // until that endpoint exists, we just refresh entitlement which the
    // store-side webhook will have updated.
    const ent = await fetchEntitlement();
    return { ok: true, entitlement: ent };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

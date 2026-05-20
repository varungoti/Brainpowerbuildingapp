// ============================================================================
// entitlement — single source of truth for premium state
// ----------------------------------------------------------------------------
// The web app today computes premium client-side from credits/payment receipts.
// This module wraps the server contract so iOS/Android (and a future re-keyed
// web check) can rely on the same shape:
//
//   GET /billing/entitlement → { isActive, plan, expiresAt, source }
//
// Native restore uses `@adplorg/capacitor-in-app-purchase` + `POST /billing/store/verify`.
// ============================================================================

import { Capacitor } from "@capacitor/core";
import { CapacitorInAppPurchase } from "@adplorg/capacitor-in-app-purchase";

import {
  extractStoreProductIdFromTransaction,
  getStoreBillingPlatform,
  verifyNativeTransactionOnServer,
  type StoreBillingPlatform,
} from "../revenue/storeBilling";
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

/**
 * Re-query StoreKit / Play Billing entitlements and POST each payload to
 * `POST /billing/store/verify`, then refresh `GET /billing/entitlement`.
 *
 * Note: platform billing clients only return active subscription-shaped
 * entitlements here; short consumable SKUs may not reappear after consume.
 */
export async function restorePurchases(): Promise<{ ok: boolean; entitlement?: Entitlement; reason?: string }> {
  const platform = getStoreBillingPlatform();
  if (!Capacitor.isNativePlatform() || !platform) {
    return { ok: false, reason: "not_supported_on_web" };
  }
  try {
    const { subscriptions } = await CapacitorInAppPurchase.getActiveSubscriptions();
    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return { ok: false, reason: "store_returned_no_receipts" };
    }
    let verified = 0;
    for (const raw of subscriptions) {
      if (typeof raw !== "string") continue;
      const productId = extractStoreProductIdFromTransaction(platform as StoreBillingPlatform, raw);
      if (!productId) continue;
      const res = await verifyNativeTransactionOnServer(platform, raw);
      if (res.ok) verified++;
    }
    if (verified === 0) {
      return { ok: false, reason: "store_receipts_unverified" };
    }
    const ent = await fetchEntitlement();
    return { ok: true, entitlement: ent };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}

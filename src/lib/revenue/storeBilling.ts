// Capacitor store billing — keep transaction parsing in sync with Edge `postBillingStoreVerify`.
import { Capacitor } from "@capacitor/core";
import { CapacitorInAppPurchase } from "@adplorg/capacitor-in-app-purchase";

import type { LaunchPlanId } from "./launchPricing";
import { LAUNCH_PAYWALL_PLANS } from "./launchPricing";
import { functionsBaseUrl, publicAnonKey } from "@/utils/supabase/info";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

/** Default Play/App Store product ids — replace in store consoles; override via VITE_STORE_PRODUCT_* */
export const DEFAULT_STORE_PRODUCT_BY_PLAN: Record<LaunchPlanId, string> = {
  day1: "com.neurospark.app.day1",
  day7: "com.neurospark.app.day7",
  day30: "com.neurospark.app.day30",
  premium_year: "com.neurospark.app.premium_year",
  family_pro_year: "com.neurospark.app.family_pro_year",
};

const ENV_KEYS: Record<LaunchPlanId, string> = {
  day1: "VITE_STORE_PRODUCT_DAY1",
  day7: "VITE_STORE_PRODUCT_DAY7",
  day30: "VITE_STORE_PRODUCT_DAY30",
  premium_year: "VITE_STORE_PRODUCT_PREMIUM_YEAR",
  family_pro_year: "VITE_STORE_PRODUCT_FAMILY_PRO_YEAR",
};

export function getStoreProductIdForPlan(planId: LaunchPlanId): string {
  const envKey = ENV_KEYS[planId];
  const fromEnv = typeof import.meta.env[envKey] === "string" ? String(import.meta.env[envKey]).trim() : "";
  return fromEnv || DEFAULT_STORE_PRODUCT_BY_PLAN[planId];
}

export type StoreBillingPlatform = "ios" | "android";

export function getStoreBillingPlatform(): StoreBillingPlatform | null {
  if (!Capacitor.isNativePlatform()) return null;
  const p = Capacitor.getPlatform();
  if (p === "ios") return "ios";
  if (p === "android") return "android";
  return null;
}

function decodeJwsPayloadLoose(jws: string): Record<string, unknown> | null {
  const parts = jws.split(".");
  if (parts.length < 2) return null;
  const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  try {
    const json = atob(b64 + pad);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Extract store product id from plugin transaction payload (Android originalJson or iOS StoreKit JWS). */
export function extractStoreProductIdFromTransaction(platform: StoreBillingPlatform, transaction: string): string | null {
  const t = transaction.trim();
  if (!t) return null;
  try {
    if (platform === "android") {
      const j = JSON.parse(t) as Record<string, unknown>;
      if (typeof j.productId === "string" && j.productId) return j.productId;
      const ids = j.productIds;
      if (Array.isArray(ids) && ids[0] != null) return String(ids[0]);
      return null;
    }
    const payload = decodeJwsPayloadLoose(t);
    if (!payload) return null;
    if (typeof payload.productId === "string" && payload.productId) return payload.productId;
    if (typeof payload.productID === "string" && payload.productID) return payload.productID;
    return null;
  } catch {
    return null;
  }
}

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

/**
 * Notify Edge to merge `billing:entitlement` after a native purchase.
 * Server resolves plan/days from the product id inside `transaction` (not from client plan hints).
 */
export async function verifyNativeTransactionOnServer(
  platform: StoreBillingPlatform,
  transaction: string,
): Promise<{ ok: boolean; error?: string; idempotent?: boolean }> {
  if (!functionsBaseUrl) return { ok: false, error: "functions_unconfigured" };
  const jwt = await getJwt();
  if (!jwt) return { ok: false, error: "not_signed_in" };
  const base = functionsBaseUrl.replace("/make-server-76b0ba9a", "");
  try {
    const resp = await fetch(`${base}/billing/store/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        apikey: publicAnonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ platform, transaction }),
    });
    const json = (await resp.json().catch(() => null)) as Record<string, unknown> | null;
    if (!resp.ok) {
      return { ok: false, error: String(json?.error ?? `http_${resp.status}`) };
    }
    if (json && json.success === true) {
      return { ok: true, idempotent: json.idempotent === true };
    }
    return { ok: false, error: "unexpected_response" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function purchaseLaunchPlanOnNative(
  planId: LaunchPlanId,
  referenceUUID: string,
): Promise<{ transaction: string }> {
  const productId = getStoreProductIdForPlan(planId);
  const plan = LAUNCH_PAYWALL_PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error("unknown_plan");

  if (plan.days >= 365) {
    const { product } = await CapacitorInAppPurchase.getProduct({ productId });
    const offerToken = product.basePlans?.[0]?.offerToken;
    return CapacitorInAppPurchase.purchaseSubscription({ productId, referenceUUID, offerToken });
  }
  return CapacitorInAppPurchase.purchaseProduct({ productId, referenceUUID });
}

/**
 * Privacy-light product analytics (funnel / quality metrics).
 * — No child names, emails, user ids, or raw DOB.
 * — Optional HTTP sink via VITE_ANALYTICS_ENDPOINT (your edge function or proxy).
 * — Dev: logs to console.debug for transparency.
 */

export type ProductEventName =
  | "paywall_view"
  | "paywall_plan_select"
  | "paywall_checkout_start"
  | "paywall_purchase_success"
  | "paywall_purchase_fail"
  | "paywall_checkout_dismiss"
  | "pack_generate"
  | "activity_complete";

/** Only coarse, non-identifying dimensions */
export interface ProductEventProps {
  age_tier?: number;
  plan_id?: string;
  days?: number;
  amount_inr?: number;
  mood?: string;
  time_min?: number;
  pack_size?: number;
  primary_intel?: string;
  duration_min?: number;
  region?: string;
  /** Generic bucket e.g. payment_error, verify_error */
  fail_reason?: string;
  boost_ai_literacy?: boolean;
  boost_dual_task?: boolean;
}

export interface ProductEventPayload extends ProductEventProps {
  event: ProductEventName;
  ts: string;
}

function getEndpoint(): string | undefined {
  const v = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/**
 * Fire-and-forget. Safe to call from UI; never throws to callers.
 */
export function captureProductEvent(name: ProductEventName, props: ProductEventProps = {}): void {
  const payload: ProductEventPayload = {
    event: name,
    ts: new Date().toISOString(),
    ...props,
  };

  if (import.meta.env.DEV) {
    console.debug("[NeuroSpark analytics]", payload);
  }

  const url = getEndpoint();
  if (!url || typeof fetch === "undefined") return;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anon) headers.Authorization = `Bearer ${anon}`;

  try {
    void fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      /* ignore network errors */
    });
  } catch {
    /* ignore */
  }
}

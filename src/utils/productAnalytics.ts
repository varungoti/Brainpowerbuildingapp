/**
 * Privacy-light product analytics (funnel / quality metrics).
 * — No child names, emails, user ids, or raw DOB.
 * — Optional HTTP sink via VITE_ANALYTICS_ENDPOINT (your edge function or proxy).
 * — Dev: logs to console.debug for transparency.
 * — Auto-attaches first-touch UTM/ns_source attribution on every event.
 */
import { getFirstTouchAttribution, getLastTouchAttribution } from "./attribution";
import { forwardEventsToPostHog } from "./posthogForwarder";

export type ProductEventName =
  | "paywall_view"
  | "paywall_plan_select"
  | "paywall_checkout_start"
  | "paywall_purchase_success"
  | "paywall_purchase_fail"
  | "paywall_checkout_dismiss"
  | "pack_generate"
  | "activity_complete"
  | "activity_open"
  // Funnel — auth + onboarding + first-activity loop (FUTURE_ROADMAP §1.2.I)
  | "screen_view"
  | "auth_view"
  | "auth_submit_attempt"
  | "auth_submit_success"
  | "auth_submit_fail"
  | "onboard_step_view"
  | "onboard_complete"
  | "first_activity_open"
  | "first_activity_complete"
  // AI-Age Readiness
  | "competency_priority_set"
  | "competency_detail_view"
  | "competency_radar_view"
  | "ai_hygiene_tour_complete"
  // Voice
  | "voice_session_start"
  | "voice_session_complete"
  | "voice_session_error"
  | "voice_settings_change"
  // Notifications
  | "notification_pref_change"
  | "notification_local_scheduled"
  // Cloud sync
  | "cloud_sync_enable"
  | "cloud_sync_pull"
  | "cloud_sync_push";

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
  intent_source?: string;
  // AI-Age Readiness props
  competency_ids?: string[];
  competency_id?: string;
  surface?: string;
  // Voice props
  voice_agent?: "coach" | "counselor" | "narrator";
  voice_locale?: string;
  voice_duration_ms?: number;
  voice_transcript_chars?: number;
  // Notification props
  notification_type?: string;
  notification_enabled?: boolean;
  // Cloud sync props
  payload_kb?: number;
  conflict_count?: number;
  // Funnel props (FUTURE_ROADMAP §1.2.I)
  /** Logical screen / view id (`auth`, `onboard_welcome`, `home`, …). */
  screen?: string;
  /** Onboarding step id: `welcome` | `child` | `materials` | `ready`. */
  step?: string;
  /** `signup` | `login` for auth events. */
  auth_mode?: string;
  /** True iff this completion brings the active child from 0 → 1 completed activities. */
  is_first_activity?: boolean;
  /** Total seconds the user spent on the auth/onboard screen before the event. */
  dwell_ms?: number;
}

export interface ProductEventPayload extends ProductEventProps {
  event: ProductEventName;
  ts: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ns_source?: string;
  ns_medium?: string;
  ns_campaign?: string;
}

function getEndpoint(): string | undefined {
  const v = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

// ─── Batched sink ────────────────────────────────────────────────────────────
// Accumulates events for `BATCH_FLUSH_MS` (or until BATCH_MAX_SIZE) and POSTs
// them in one request. Visibilitychange/pagehide flush via sendBeacon if
// available so we don't lose tail events. Falls back to fetch keepalive.
// ----------------------------------------------------------------------------
const BATCH_FLUSH_MS = 4000;
const BATCH_MAX_SIZE = 25;

let pendingEvents: ProductEventPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

function bindLifecycleListenersOnce() {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  // pagehide is more reliable than unload on mobile Safari
  window.addEventListener("pagehide", () => flushBatch(true));
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushBatch(true);
  });
}

function scheduleFlush() {
  if (flushTimer != null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushBatch(false);
  }, BATCH_FLUSH_MS);
}

function flushBatch(useBeacon: boolean) {
  if (pendingEvents.length === 0) return;
  const batch = pendingEvents.splice(0, pendingEvents.length);

  // Fan out the SAME batch to every active sink. Order matters only for
  // tests — both sinks use fire-and-forget fetch + sendBeacon, so failures
  // in one never affect the other.
  forwardEventsToPostHog(batch);

  const url = getEndpoint();
  if (!url) return;

  const body = JSON.stringify({ batch });
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anon) headers.Authorization = `Bearer ${anon}`;

  const beaconWorked =
    useBeacon &&
    typeof navigator !== "undefined" &&
    typeof navigator.sendBeacon === "function" &&
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));

  if (beaconWorked) return;

  try {
    void fetch(url, { method: "POST", headers, body, keepalive: true }).catch(() => undefined);
  } catch {
    /* swallow */
  }
}

/**
 * Fire-and-forget. Safe to call from UI; never throws to callers.
 * Events are batched and flushed every few seconds to reduce request volume.
 */
export function captureProductEvent(name: ProductEventName, props: ProductEventProps = {}): void {
  const first = getFirstTouchAttribution();
  const last = getLastTouchAttribution();
  const payload: ProductEventPayload = {
    event: name,
    ts: new Date().toISOString(),
    ...(first
      ? {
          utm_source: first.source,
          utm_medium: first.medium,
          utm_campaign: first.campaign,
          utm_content: first.content,
          utm_term: first.term,
        }
      : {}),
    ...(last && last !== first
      ? { ns_source: last.source, ns_medium: last.medium, ns_campaign: last.campaign }
      : {}),
    ...props,
  };

  if (import.meta.env.DEV) {
    console.debug("[NeuroSpark analytics]", payload);
  }

  // Dispatch on the window event bus so external integrations and the E2E
  // suite can observe analytics without an HTTP sink. Listeners are usually
  // empty in production, so the cost is one CustomEvent allocation.
  if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent("neurospark:product_event", { detail: payload }),
      );
    } catch {
      /* ignore — never let an analytics observer crash the app */
    }
  }

  const url = getEndpoint();
  if (!url || typeof fetch === "undefined") return;

  bindLifecycleListenersOnce();
  pendingEvents.push(payload);

  if (pendingEvents.length >= BATCH_MAX_SIZE) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flushBatch(false);
  } else {
    scheduleFlush();
  }
}

/** Test helper — drains the current batch synchronously without sending. */
export function __resetAnalyticsBufferForTests(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  pendingEvents = [];
}

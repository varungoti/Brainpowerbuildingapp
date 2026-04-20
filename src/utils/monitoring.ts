import * as Sentry from "@sentry/react";
import { isFeatureEnabled } from "./featureFlags";

let clientMonitoringActive = false;

/**
 * Optional error reporting for production builds only.
 * - No Session Replay (household / child-adjacent privacy).
 * - No default PII; do not call Sentry.setUser with child or parent identifiers.
 *
 * Activation requires THREE conditions:
 *   1. import.meta.env.PROD                   — never fire in dev/test
 *   2. VITE_SENTRY_DSN is set                 — DSN present
 *   3. VITE_FEATURE_FLAGS does NOT contain
 *      `monitoring_kill`                     — remote kill switch off
 *
 * The `monitoring_kill` flag lets ops disable Sentry from a build-time
 * config without redeploying app code (FUTURE_ROADMAP §1.2.I).
 */
function isProductionBuild(): boolean {
  // Same string/boolean coercion fix as posthogForwarder — Vite gives us
  // a real boolean in production builds; vi.stubEnv in tests gives us a
  // string (which would be unconditionally truthy).
  const raw = (import.meta.env as Record<string, unknown>).PROD;
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") return raw === "true";
  return false;
}

export function initClientMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn || !isProductionBuild()) return;
  if (isFeatureEnabled("monitoring_kill")) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENV?.trim() || import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      // Extra guard: never attach replay (not enabled, but belt-and-suspenders).
      if (event.sdkProcessingMetadata) {
        delete (event.sdkProcessingMetadata as Record<string, unknown>).replayId;
      }
      return event;
    },
  });
  clientMonitoringActive = true;
}

/** Test/internal: report whether Sentry was successfully initialised. */
export function isClientMonitoringActive(): boolean {
  return clientMonitoringActive;
}

/** Report a React render error (e.g. from ErrorBoundary). No-op if Sentry not initialized. */
export function reportClientError(
  error: Error,
  info?: { componentStack?: string; screen?: string },
): void {
  if (!clientMonitoringActive) return;
  const stack = info?.componentStack?.slice(0, 2000);
  const extra: Record<string, unknown> = {};
  if (stack) extra.componentStack = stack;
  if (info?.screen) extra.screen = info.screen;
  Sentry.captureException(
    error,
    Object.keys(extra).length > 0 ? { extra } : undefined,
  );
}

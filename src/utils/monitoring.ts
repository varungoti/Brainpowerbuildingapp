import * as Sentry from "@sentry/react";

let clientMonitoringActive = false;

/**
 * Optional error reporting for production builds only.
 * - No Session Replay (household / child-adjacent privacy).
 * - No default PII; do not call Sentry.setUser with child or parent identifiers.
 */
export function initClientMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn || !import.meta.env.PROD) return;

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

/** Report a React render error (e.g. from ErrorBoundary). No-op if Sentry not initialized. */
export function reportClientError(error: Error, info?: { componentStack?: string }): void {
  if (!clientMonitoringActive) return;
  const stack = info?.componentStack?.slice(0, 2000);
  Sentry.captureException(error, stack ? { extra: { componentStack: stack } } : undefined);
}

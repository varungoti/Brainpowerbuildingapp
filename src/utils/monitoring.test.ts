import { afterEach, describe, expect, it, vi } from "vitest";
import { initClientMonitoring, isClientMonitoringActive, reportClientError } from "./monitoring";

describe("monitoring", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("initClientMonitoring does not throw in test / dev", () => {
    expect(() => initClientMonitoring()).not.toThrow();
  });

  it("reportClientError does not throw when Sentry inactive", () => {
    expect(() => reportClientError(new Error("test"), { componentStack: "x" })).not.toThrow();
  });

  it("does not init Sentry when DSN is missing even in PROD", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", "");
    vi.resetModules();
    const mod = await import("./monitoring");
    mod.initClientMonitoring();
    expect(mod.isClientMonitoringActive()).toBe(false);
  });

  it("does not init Sentry when DSN is set but `monitoring_kill` flag is on (remote kill switch)", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_SENTRY_DSN", "https://example@sentry.io/123");
    vi.stubEnv("VITE_FEATURE_FLAGS", "monitoring_kill");
    vi.resetModules();
    const mod = await import("./monitoring");
    mod.initClientMonitoring();
    expect(mod.isClientMonitoringActive()).toBe(false);
  });

  it("does not init Sentry in non-prod even when DSN set", async () => {
    // NOTE: do NOT stub PROD — Vitest 4 coerces any stubbed value of a
    // known boolean env var to `true`. The unstubbed default in test
    // runs is PROD=false, which is exactly what we want.
    vi.stubEnv("VITE_SENTRY_DSN", "https://example@sentry.io/123");
    vi.stubEnv("VITE_FEATURE_FLAGS", "");
    vi.resetModules();
    const mod = await import("./monitoring");
    mod.initClientMonitoring();
    expect(mod.isClientMonitoringActive()).toBe(false);
  });

  it("isClientMonitoringActive() returns boolean (smoke)", () => {
    expect(typeof isClientMonitoringActive()).toBe("boolean");
  });
});

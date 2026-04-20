// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetPostHogForwarderForTests,
  isPostHogActive,
} from "./posthogForwarder";
import type { ProductEventPayload } from "./productAnalytics";

// import.meta.env is read at call-time by the module; we toggle it via
// vi.stubEnv so each test runs in isolation.

const SAMPLE_EVENTS: ProductEventPayload[] = [
  { event: "auth_view", ts: "2026-04-17T01:00:00.000Z", screen: "auth", auth_mode: "signup" },
  { event: "first_activity_complete", ts: "2026-04-17T01:05:00.000Z", screen: "activity_detail", duration_min: 12 },
];

// NOTE: vi.stubEnv("PROD", ...) coerces ANY value (including "false") to the
// boolean `true` in Vitest 4 (the act of stubbing a known boolean env var is
// the signal). Therefore the canonical pattern is:
//   "PROD on"  → vi.stubEnv("PROD", "true")
//   "PROD off" → DON'T stub PROD at all (default test mode is false)
function envOff(): void {
  vi.stubEnv("VITE_POSTHOG_KEY", "");
  vi.stubEnv("VITE_POSTHOG_HOST", "");
  vi.stubEnv("VITE_FEATURE_FLAGS", "");
  // No PROD stub → PROD = false (test default).
}

function envOn(opts: { key?: string; host?: string; flags?: string; prod?: boolean } = {}): void {
  vi.stubEnv("VITE_POSTHOG_KEY", opts.key ?? "phk_test_key");
  vi.stubEnv("VITE_POSTHOG_HOST", opts.host ?? "https://eu.i.posthog.com");
  vi.stubEnv("VITE_FEATURE_FLAGS", opts.flags ?? "posthog");
  if (opts.prod !== false) {
    // Vitest 4 typing for `PROD` accepts boolean; the actual stub coerces to true regardless.
    vi.stubEnv("PROD", true);
  }
}

describe("posthogForwarder", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __resetPostHogForwarderForTests();
    // featureFlags caches the parsed VITE_FEATURE_FLAGS, so reset its module
    // state by re-importing the module fresh through vi.resetModules in tests
    // that need to flip the flag — handled inline.
    fetchSpy = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    Object.defineProperty(globalThis, "fetch", { value: fetchSpy, writable: true, configurable: true });
    try {
      localStorage.clear();
    } catch {
      /* jsdom edge */
    }
  });

  afterEach(() => {
    __resetPostHogForwarderForTests();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("isPostHogActive() = false when no env is configured", async () => {
    envOff();
    // featureFlags caches; reset by reimporting.
    vi.resetModules();
    const mod = await import("./posthogForwarder");
    mod.__resetPostHogForwarderForTests();
    expect(mod.isPostHogActive()).toBe(false);
  });

  it("isPostHogActive() = false when key is set but feature flag is off", async () => {
    envOn({ flags: "" });
    vi.resetModules();
    const mod = await import("./posthogForwarder");
    mod.__resetPostHogForwarderForTests();
    expect(mod.isPostHogActive()).toBe(false);
  });

  it("isPostHogActive() = false when flag on but key absent", async () => {
    envOn({ key: "" });
    vi.resetModules();
    const mod = await import("./posthogForwarder");
    mod.__resetPostHogForwarderForTests();
    expect(mod.isPostHogActive()).toBe(false);
  });

  it("isPostHogActive() = false when not in PROD even with key + flag", async () => {
    envOn({ prod: false });
    vi.resetModules();
    const mod = await import("./posthogForwarder");
    mod.__resetPostHogForwarderForTests();
    expect(mod.isPostHogActive()).toBe(false);
  });

  it("forwardEventsToPostHog is a no-op when inactive", async () => {
    envOff();
    vi.resetModules();
    const mod = await import("./posthogForwarder");
    mod.__resetPostHogForwarderForTests();
    mod.forwardEventsToPostHog(SAMPLE_EVENTS);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwardEventsToPostHog posts to {host}/i/v0/e/ when active", async () => {
    envOn({ key: "phk_xyz", host: "https://eu.i.posthog.com", flags: "posthog,other" });
    vi.resetModules();
    const mod = await import("./posthogForwarder");
    mod.__resetPostHogForwarderForTests();
    mod.forwardEventsToPostHog(SAMPLE_EVENTS);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://eu.i.posthog.com/i/v0/e/");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as { api_key: string; batch: Array<Record<string, unknown>> };
    expect(body.api_key).toBe("phk_xyz");
    expect(body.batch).toHaveLength(2);
    expect(body.batch[0].event).toBe("auth_view");
    expect((body.batch[0].properties as Record<string, unknown>).screen).toBe("auth");
    // distinct_id must be present and stable (uuid-ish)
    expect(typeof body.batch[0].distinct_id).toBe("string");
    expect((body.batch[0].distinct_id as string).length).toBeGreaterThan(8);
    // batch[0] and batch[1] share the same distinct_id (same browser session)
    expect(body.batch[0].distinct_id).toBe(body.batch[1].distinct_id);
  });

  it("uses the default host when VITE_POSTHOG_HOST is unset", async () => {
    envOn({ host: "" });
    vi.resetModules();
    const mod = await import("./posthogForwarder");
    mod.__resetPostHogForwarderForTests();
    mod.forwardEventsToPostHog(SAMPLE_EVENTS);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect((fetchSpy.mock.calls[0] as [string, RequestInit])[0]).toBe("https://us.i.posthog.com/i/v0/e/");
  });

  it("never throws when fetch rejects synchronously", async () => {
    envOn();
    vi.resetModules();
    const mod = await import("./posthogForwarder");
    mod.__resetPostHogForwarderForTests();
    Object.defineProperty(globalThis, "fetch", {
      value: () => {
        throw new Error("network is down");
      },
      writable: true,
      configurable: true,
    });
    expect(() => mod.forwardEventsToPostHog(SAMPLE_EVENTS)).not.toThrow();
  });

  it("persists distinct_id across module re-imports (same browser, new pageload)", async () => {
    envOn();
    vi.resetModules();
    const mod = await import("./posthogForwarder");
    mod.__resetPostHogForwarderForTests();
    mod.forwardEventsToPostHog([SAMPLE_EVENTS[0]]);
    const firstId = ((JSON.parse((fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string) as {
      batch: Array<Record<string, unknown>>;
    }).batch[0].distinct_id) as string;
    fetchSpy.mockClear();

    // Simulate a new page load — reset module state but keep localStorage.
    vi.resetModules();
    const mod2 = await import("./posthogForwarder");
    mod2.__resetPostHogForwarderForTests();
    mod2.forwardEventsToPostHog([SAMPLE_EVENTS[0]]);
    const secondId = ((JSON.parse((fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string) as {
      batch: Array<Record<string, unknown>>;
    }).batch[0].distinct_id) as string;
    expect(secondId).toBe(firstId);
  });

  it("empty batch is a no-op", async () => {
    envOn();
    vi.resetModules();
    const mod = await import("./posthogForwarder");
    mod.__resetPostHogForwarderForTests();
    mod.forwardEventsToPostHog([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// Ensure the legacy entry-point smoke test still works without env stubs
// (covered by productAnalytics.test.ts but cheap to assert here).
describe("isPostHogActive default", () => {
  it("defaults to false in the absence of any env stubs", () => {
    __resetPostHogForwarderForTests();
    expect(isPostHogActive()).toBe(false);
  });
});

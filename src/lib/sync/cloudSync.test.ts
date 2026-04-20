// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../utils/productAnalytics", () => ({
  captureProductEvent: vi.fn(),
}));

vi.mock("../../utils/supabase/info", () => ({
  functionsBaseUrl: "https://example.test/functions/v1",
  publicAnonKey: "anon-test-key",
  projectId: "example",
}));

import {
  pushStateNow,
  pullState,
  isCloudSyncEnabled,
  setCloudSyncEnabled,
} from "./cloudSync";

const mockFetch = vi.fn();

describe("cloudSync", () => {
  beforeEach(() => {
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    mockFetch.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("isCloudSyncEnabled defaults to false", () => {
    expect(isCloudSyncEnabled()).toBe(false);
  });

  it("setCloudSyncEnabled persists the flag", () => {
    setCloudSyncEnabled(true);
    expect(isCloudSyncEnabled()).toBe(true);
    setCloudSyncEnabled(false);
    expect(isCloudSyncEnabled()).toBe(false);
  });

  it("pushStateNow returns ok with version on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: 7, conflict: false }),
    });
    const result = await pushStateNow({ foo: 1 }, "jwt-x");
    expect(result.ok).toBe(true);
    expect(result.version).toBe(7);
    expect(result.conflict).toBe(false);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/sync/state");
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer jwt-x",
    });
  });

  it("pushStateNow surfaces conflicts", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: 8, conflict: true }),
    });
    const result = await pushStateNow({}, null);
    expect(result.conflict).toBe(true);
  });

  it("pushStateNow returns ok=false on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await pushStateNow({}, null);
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toMatch(/500/);
  });

  it("pushStateNow handles network errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("offline"));
    const result = await pushStateNow({}, null);
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toBe("offline");
  });

  it("pullState returns state on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: { hello: "world" }, version: 3 }),
    });
    const result = await pullState("jwt");
    expect(result.ok).toBe(true);
    expect(result.state).toEqual({ hello: "world" });
    expect(result.version).toBe(3);
  });

  it("pullState falls back to anon key when no JWT", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: null, version: 0 }),
    });
    await pullState(null);
    const [, init] = mockFetch.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer anon-test-key",
    });
  });
});

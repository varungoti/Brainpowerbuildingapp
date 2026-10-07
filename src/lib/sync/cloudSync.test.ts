// @vitest-environment node
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
  captureCloudSyncOperation,
  pushStateDebounced,
  pullState,
  isCloudSyncEnabled,
  setCloudSyncEnabled,
} from "./cloudSync";
import { captureProductEvent } from "../../utils/productAnalytics";

const mockFetch = vi.fn();

describe("cloudSync", () => {
  beforeEach(() => {
    const stored = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => { stored.set(key, String(value)); },
      removeItem: (key: string) => { stored.delete(key); },
      clear: () => { stored.clear(); },
    });
    vi.stubGlobal("fetch", mockFetch);
    vi.useFakeTimers();
    setCloudSyncEnabled(false);
    mockFetch.mockReset();
    vi.mocked(captureProductEvent).mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    setCloudSyncEnabled(false);
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
    setCloudSyncEnabled(true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: 7, conflict: false }),
    });
    const result = await pushStateNow({ foo: 1 }, "jwt-x", captureCloudSyncOperation());
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
    setCloudSyncEnabled(true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ version: 8, conflict: true }),
    });
    const result = await pushStateNow({}, null, captureCloudSyncOperation());
    expect(result.conflict).toBe(true);
  });

  it("pushStateNow returns ok=false on HTTP error", async () => {
    setCloudSyncEnabled(true);
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const result = await pushStateNow({}, null, captureCloudSyncOperation());
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toMatch(/500/);
  });

  it("pushStateNow handles network errors gracefully", async () => {
    setCloudSyncEnabled(true);
    mockFetch.mockRejectedValueOnce(new Error("offline"));
    const result = await pushStateNow({}, null, captureCloudSyncOperation());
    expect(result.ok).toBe(false);
    expect(result.errorMessage).toBe("offline");
  });

  it("pullState returns state on success", async () => {
    setCloudSyncEnabled(true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: { hello: "world" }, version: 3 }),
    });
    const result = await pullState("jwt", captureCloudSyncOperation());
    expect(result.ok).toBe(true);
    expect(result.state).toEqual({ hello: "world" });
    expect(result.version).toBe(3);
  });

  it("pullState falls back to anon key when no JWT", async () => {
    setCloudSyncEnabled(true);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ state: null, version: 0 }),
    });
    await pullState(null, captureCloudSyncOperation());
    const [, init] = mockFetch.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer anon-test-key",
    });
  });

  it("denies a direct push before opt-in without serializing the snapshot", async () => {
    const toJSON = vi.fn(() => ({ fixture: "synthetic-family" }));
    const result = await pushStateNow({ toJSON }, "synthetic-session", captureCloudSyncOperation());
    expect(result).toEqual({ ok: false, errorMessage: "Cloud sync is disabled" });
    expect(toJSON).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(captureProductEvent).not.toHaveBeenCalled();
    expect(localStorage.getItem("neurospark_device_id")).toBeNull();
  });

  it("denies a pull while disabled", async () => {
    const result = await pullState("synthetic-session", captureCloudSyncOperation());
    expect(result).toEqual({ ok: false, errorMessage: "Cloud sync is disabled" });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(captureProductEvent).not.toHaveBeenCalled();
  });

  it("does not schedule a snapshot while disabled", async () => {
    pushStateDebounced({ fixture: "synthetic-family" }, "synthetic-session", captureCloudSyncOperation());
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("cancels a queued snapshot immediately when opt-in is revoked", async () => {
    setCloudSyncEnabled(true);
    const onResult = vi.fn();
    pushStateDebounced({ fixture: "synthetic-family" }, "synthetic-session", captureCloudSyncOperation(), onResult);
    expect(vi.getTimerCount()).toBe(1);
    setCloudSyncEnabled(false);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(onResult).not.toHaveBeenCalled();
  });

  it("does not resurrect the old snapshot when sync is re-enabled", async () => {
    setCloudSyncEnabled(true);
    pushStateDebounced({ fixture: "stale-synthetic-family" }, "synthetic-session", captureCloudSyncOperation());
    setCloudSyncEnabled(false);
    setCloudSyncEnabled(true);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rechecks external flag revocation when the debounce expires", async () => {
    setCloudSyncEnabled(true);
    const onResult = vi.fn();
    pushStateDebounced({ fixture: "synthetic-family" }, "synthetic-session", captureCloudSyncOperation(), onResult);
    localStorage.setItem("neurospark_cloud_sync_enabled", "0");
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(onResult).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("fails closed when preference storage cannot be read at dispatch", async () => {
    setCloudSyncEnabled(true);
    pushStateDebounced({ fixture: "synthetic-family" }, "synthetic-session", captureCloudSyncOperation());
    vi.spyOn(localStorage, "getItem").mockImplementation(() => { throw new Error("storage unavailable"); });
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("keeps opt-out denied when persisting the revocation fails", async () => {
    setCloudSyncEnabled(true);
    pushStateDebounced({ fixture: "synthetic-family" }, "synthetic-session", captureCloudSyncOperation());
    const persist = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("storage unavailable"); });
    setCloudSyncEnabled(false);
    expect(localStorage.getItem("neurospark_cloud_sync_enabled")).toBe("1");
    expect(isCloudSyncEnabled()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    pushStateDebounced({ fixture: "later-synthetic-family" }, "synthetic-session", captureCloudSyncOperation());
    await pushStateNow({ fixture: "manual-synthetic-family" }, "synthetic-session", captureCloudSyncOperation());
    await pullState("synthetic-session", captureCloudSyncOperation());
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockFetch).not.toHaveBeenCalled();
    persist.mockRestore();
    setCloudSyncEnabled(true);
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ version: 10, conflict: false }) });
    pushStateDebounced({ fixture: "newly-consented-synthetic-family" }, "synthetic-session", captureCloudSyncOperation());
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).state).toEqual({ fixture: "newly-consented-synthetic-family" });
  });

  it("does not lift a session opt-out when a later opt-in cannot persist", async () => {
    setCloudSyncEnabled(true);
    const persist = vi.spyOn(localStorage, "setItem").mockImplementation(() => { throw new Error("storage unavailable"); });
    setCloudSyncEnabled(false);
    setCloudSyncEnabled(true);
    expect(isCloudSyncEnabled()).toBe(false);
    await pushStateNow({ fixture: "synthetic-family" }, "synthetic-session", captureCloudSyncOperation());
    expect(mockFetch).not.toHaveBeenCalled();
    persist.mockRestore();
  });

  it("allows a newly queued snapshot after an explicit successful re-enable", async () => {
    setCloudSyncEnabled(true);
    pushStateDebounced({ fixture: "stale-synthetic-family" }, "old-synthetic-session", captureCloudSyncOperation());
    setCloudSyncEnabled(false);
    setCloudSyncEnabled(true);
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ version: 9, conflict: false }) });
    pushStateDebounced({ fixture: "new-synthetic-family" }, "new-synthetic-session", captureCloudSyncOperation());
    await vi.advanceTimersByTimeAsync(4000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).state).toEqual({ fixture: "new-synthetic-family" });
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer new-synthetic-session");
  });

  it("rejects a queued upload whose session resolves after opt-out", async () => {
    setCloudSyncEnabled(true);
    const operation = captureCloudSyncOperation();
    let resolveSession!: (jwt: string) => void;
    const session = new Promise<string>((resolve) => { resolveSession = resolve; });
    const resume = (async () => {
      pushStateDebounced({ fixture: "synthetic-family" }, await session, operation);
    })();
    setCloudSyncEnabled(false);
    resolveSession("synthetic-session");
    await resume;
    await vi.advanceTimersByTimeAsync(4000);
    expect(vi.getTimerCount()).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects manual push and pull whose sessions resolve after opt-out", async () => {
    setCloudSyncEnabled(true);
    const operation = captureCloudSyncOperation();
    let resolveSession!: (jwt: string) => void;
    const session = new Promise<string>((resolve) => { resolveSession = resolve; });
    const push = (async () => pushStateNow({ fixture: "synthetic-family" }, await session, operation))();
    const pull = (async () => pullState(await session, operation))();
    setCloudSyncEnabled(false);
    resolveSession("synthetic-session");
    expect((await push).ok).toBe(false);
    expect((await pull).ok).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not let an old session lookup replace the fresh queue after off/on", async () => {
    setCloudSyncEnabled(true);
    const oldOperation = captureCloudSyncOperation();
    let resolveSession!: (jwt: string) => void;
    const session = new Promise<string>((resolve) => { resolveSession = resolve; });
    const oldResult = vi.fn();
    const oldCaller = (async () => {
      pushStateDebounced({ fixture: "stale-before-opt-out" }, await session, oldOperation, oldResult);
    })();
    setCloudSyncEnabled(false);
    setCloudSyncEnabled(true);
    const freshOperation = captureCloudSyncOperation();
    expect(freshOperation).not.toEqual(oldOperation);
    const freshResult = vi.fn();
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ version: 13, conflict: false }) });
    pushStateDebounced({ fixture: "fresh-after-re-enable" }, "new-synthetic-session", freshOperation, freshResult);
    await vi.advanceTimersByTimeAsync(3999);
    resolveSession("old-synthetic-session");
    await oldCaller;
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).state).toEqual({ fixture: "fresh-after-re-enable" });
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer new-synthetic-session");
    expect(freshResult).toHaveBeenCalledExactlyOnceWith({ ok: true, version: 13, conflict: false });
    expect(oldResult).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects an old manual snapshot after off/on and a newer completed upload", async () => {
    setCloudSyncEnabled(true);
    const oldOperation = captureCloudSyncOperation();
    const oldSnapshot = { fixture: "old-manual-snapshot" };
    let resolveSession!: (jwt: string) => void;
    const session = new Promise<string>((resolve) => { resolveSession = resolve; });
    const oldManual = (async () => pushStateNow(oldSnapshot, await session, oldOperation))();
    setCloudSyncEnabled(false);
    setCloudSyncEnabled(true);
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ version: 14, conflict: false }) });
    pushStateDebounced({ fixture: "new-auto-snapshot" }, "new-synthetic-session", captureCloudSyncOperation());
    await vi.advanceTimersByTimeAsync(4000);
    resolveSession("old-synthetic-session");
    expect(await oldManual).toEqual({ ok: false, errorMessage: "Cloud sync consent has changed" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).state).toEqual({ fixture: "new-auto-snapshot" });
  });

  it("rejects an old opt-in pull resumed after off/on", async () => {
    setCloudSyncEnabled(true);
    const oldOperation = captureCloudSyncOperation();
    let resolveSession!: (jwt: string) => void;
    const session = new Promise<string>((resolve) => { resolveSession = resolve; });
    const pending = (async () => pullState(await session, oldOperation))();
    setCloudSyncEnabled(false);
    setCloudSyncEnabled(true);
    resolveSession("old-synthetic-session");
    expect(await pending).toEqual({ ok: false, errorMessage: "Cloud sync consent has changed" });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects an old generation if serialization opts out and back in", async () => {
    setCloudSyncEnabled(true);
    const operation = captureCloudSyncOperation();
    const snapshot = { toJSON: () => {
      setCloudSyncEnabled(false);
      setCloudSyncEnabled(true);
      return { fixture: "stale-synthetic-snapshot" };
    } };
    expect(await pushStateNow(snapshot, "synthetic-session", operation)).toEqual({
      ok: false, errorMessage: "Cloud sync consent has changed",
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("keeps the latest-snapshot debounce and callback semantics when enabled", async () => {
    setCloudSyncEnabled(true);
    const oldResult = vi.fn();
    const latestResult = vi.fn();
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ version: 11, conflict: true }) });
    pushStateDebounced({ fixture: "old" }, "old-synthetic-session", captureCloudSyncOperation(), oldResult);
    await vi.advanceTimersByTimeAsync(3000);
    pushStateDebounced({ fixture: "latest" }, "latest-synthetic-session", captureCloudSyncOperation(), latestResult);
    await vi.advanceTimersByTimeAsync(3999);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).state).toEqual({ fixture: "latest" });
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer latest-synthetic-session");
    expect(oldResult).not.toHaveBeenCalled();
    expect(latestResult).toHaveBeenCalledExactlyOnceWith({ ok: true, version: 11, conflict: true });
    expect(captureProductEvent).toHaveBeenCalledWith("cloud_sync_push", { payload_kb: 0, conflict_count: 1 });
  });

  it("preserves the callback's error result for an enabled queued request", async () => {
    setCloudSyncEnabled(true);
    const onResult = vi.fn();
    mockFetch.mockRejectedValueOnce(new Error("synthetic offline failure"));
    pushStateDebounced({ fixture: "synthetic-family" }, "synthetic-session", captureCloudSyncOperation(), onResult);
    await vi.advanceTimersByTimeAsync(4000);
    expect(onResult).toHaveBeenCalledExactlyOnceWith({ ok: false, errorMessage: "synthetic offline failure" });
  });

  it("cancels a timer even when its handle is zero", () => {
    setCloudSyncEnabled(true);
    vi.spyOn(globalThis, "setTimeout").mockReturnValueOnce(0 as unknown as ReturnType<typeof setTimeout>);
    const clear = vi.spyOn(globalThis, "clearTimeout");
    pushStateDebounced({ fixture: "synthetic-family" }, "synthetic-session", captureCloudSyncOperation());
    setCloudSyncEnabled(false);
    expect(clear).toHaveBeenCalledWith(0);
  });

  it("rechecks consent after snapshot serialization and before fetch", async () => {
    setCloudSyncEnabled(true);
    const state = { toJSON: () => { setCloudSyncEnabled(false); return { fixture: "synthetic-family" }; } };
    const result = await pushStateNow(state, "synthetic-session", captureCloudSyncOperation());
    expect(result.ok).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not claim to recall a request already handed to fetch", async () => {
    setCloudSyncEnabled(true);
    let resolveFetch!: (value: unknown) => void;
    mockFetch.mockImplementationOnce(() => new Promise((resolve) => { resolveFetch = resolve; }));
    const pending = pushStateNow({ fixture: "already-dispatched" }, "synthetic-session", captureCloudSyncOperation());
    expect(mockFetch).toHaveBeenCalledTimes(1);
    setCloudSyncEnabled(false);
    resolveFetch({ ok: true, json: async () => ({ version: 12, conflict: false }) });
    expect(await pending).toEqual({ ok: true, version: 12, conflict: false });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(isCloudSyncEnabled()).toBe(false);
  });
});

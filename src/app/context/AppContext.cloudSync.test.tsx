// @vitest-environment jsdom
import React from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider, useApp } from "./AppContext";
import { isCloudSyncEnabled, setCloudSyncEnabled } from "../../lib/sync/cloudSync";

const controls = vi.hoisted(() => ({ getSession: vi.fn(), signOut: vi.fn(), onAuthStateChange: vi.fn(), fetch: vi.fn() }));
vi.mock("../../utils/productAnalytics", () => ({ captureProductEvent: vi.fn() }));
vi.mock("../../utils/supabase/info", () => ({ functionsBaseUrl: "https://example.test/functions/v1", publicAnonKey: "synthetic-anon" }));
vi.mock("../../utils/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: { getSession: controls.getSession, onAuthStateChange: controls.onAuthStateChange } }),
  signOutSupabase: controls.signOut,
}));

function session(id = "synthetic-a"): Session {
  return { access_token: `synthetic-jwt-${id}`, user: { id, email: `${id}@example.test`, user_metadata: {}, created_at: "2026-10-23" } } as Session;
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

let current: ReturnType<typeof useApp> | undefined;
function Probe() { current = useApp(); return null; }
function app() { if (!current) throw new Error("Missing synthetic provider"); return current; }
let authListener: (event: AuthChangeEvent, session: Session | null) => void;
const mount = async () => {
  render(<AppProvider><Probe /></AppProvider>);
  await act(async () => { await Promise.resolve(); });
};

describe("AppContext cloud consent and account lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    current = undefined;
    localStorage.clear();
    localStorage.setItem("neurospark_v2", JSON.stringify({
      user: { id: "synthetic-a", supabaseUid: "synthetic-a", email: "a@example.test", name: "Synthetic A", createdAt: "2026-10-23" },
      cloudSyncOwnerId: "synthetic-a",
      narrativeCache: { week: "Synthetic account A report" },
    }));
    controls.getSession.mockReset().mockResolvedValue({ data: { session: session() } });
    controls.signOut.mockReset().mockResolvedValue(undefined);
    controls.onAuthStateChange.mockReset().mockImplementation((listener) => {
      authListener = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    controls.fetch.mockReset().mockResolvedValue({ ok: true, json: async () => ({ version: 1 }) });
    vi.stubGlobal("fetch", controls.fetch);
    setCloudSyncEnabled(true);
  });
  afterEach(() => {
    cleanup();
    setCloudSyncEnabled(false);
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("uploads the synthetic snapshot only for its matching session owner", async () => {
    await mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(controls.fetch).toHaveBeenCalledTimes(1);
    const init = controls.fetch.mock.calls[0][1];
    expect(init.headers.Authorization).toBe("Bearer synthetic-jwt-synthetic-a");
    expect(JSON.parse(init.body).state.payload.cloudSyncOwnerId).toBe("synthetic-a");
  });

  it("turns off legacy consent when retained family ownership cannot be established", async () => {
    const legacy = JSON.parse(localStorage.getItem("neurospark_v2")!);
    delete legacy.cloudSyncOwnerId;
    localStorage.setItem("neurospark_v2", JSON.stringify(legacy));
    await mount();
    expect(isCloudSyncEnabled()).toBe(false);
    expect(app().cloudSyncQuarantined).toBe(true);
    expect(app().narrativeCache.week).toBe("Synthetic account A report");
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(controls.fetch).not.toHaveBeenCalled();
  });

  it("revokes instead of sending A's snapshot with a resolved B session", async () => {
    controls.getSession.mockResolvedValue({ data: { session: session("synthetic-b") } });
    await mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(isCloudSyncEnabled()).toBe(false);
    expect(controls.fetch).not.toHaveBeenCalled();
  });

  it("cancels a queued upload immediately when logout starts, before sign-out resolves", async () => {
    const signOut = deferred<void>();
    controls.signOut.mockReturnValue(signOut.promise);
    await mount();
    act(() => { app().logoutUser(); });
    expect(isCloudSyncEnabled()).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(controls.fetch).not.toHaveBeenCalled();
    await act(async () => { signOut.resolve(); });
  });

  it("rejects a session lookup that completes after logout starts", async () => {
    const lookup = deferred<{ data: { session: Session } }>();
    controls.getSession.mockReturnValue(lookup.promise);
    await mount();
    act(() => { app().logoutUser(); });
    await act(async () => { lookup.resolve({ data: { session: session() } }); });
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(controls.fetch).not.toHaveBeenCalled();
  });

  it("does not let an old logout completion erase a newer login and its child", async () => {
    const signOut = deferred<void>();
    controls.signOut.mockReturnValue(signOut.promise);
    await mount();
    act(() => { app().logoutUser(); });
    act(() => { app().loginUser("b@example.test", "Synthetic B", { supabaseUid: "synthetic-b" }); });
    act(() => { app().addChild({ name: "Synthetic B Child", dob: "2021-01-01", avatarEmoji: "🦁", avatarColor: "#000" }); });
    act(() => { authListener("SIGNED_OUT", null); });
    await act(async () => { signOut.resolve(); });
    expect(app().user?.supabaseUid).toBe("synthetic-b");
    expect(app().children.map((child) => child.name)).toEqual(["Synthetic B Child"]);
    expect(app().cloudSyncQuarantined).toBe(true);
    expect(isCloudSyncEnabled()).toBe(false);
  });

  it("completes explicit local-only logout even when its own SIGNED_OUT arrives first", async () => {
    const signOut = deferred<void>();
    controls.signOut.mockReturnValue(signOut.promise);
    await mount();
    act(() => { app().loginUser("local@example.test", "Synthetic Local"); });
    act(() => { app().logoutUser(); });
    act(() => { authListener("SIGNED_OUT", null); });
    await act(async () => { signOut.resolve(); });
    expect(app().user).toBeNull();
    expect(app().children).toEqual([]);
  });

  it("preserves a restored family when an older logout emits its event and completes", async () => {
    const signOut = deferred<void>();
    controls.signOut.mockReturnValue(signOut.promise);
    await mount();
    const backup = app().exportLocalDataBackup();
    act(() => { app().logoutUser(); });
    act(() => { expect(app().importLocalDataBackup(backup).ok).toBe(true); });
    act(() => { authListener("SIGNED_OUT", null); });
    await act(async () => { signOut.resolve(); });
    expect(app().user?.supabaseUid).toBe("synthetic-a");
    expect(app().narrativeCache.week).toBe("Synthetic account A report");
    expect(app().cloudSyncQuarantined).toBe(true);
    expect(isCloudSyncEnabled()).toBe(false);
  });

  it("quarantines retained A data through logout, B login and re-opt-in", async () => {
    await mount();
    await act(async () => { app().logoutUser(); });
    expect(app().cloudSyncOwnerId).toBe("synthetic-a");
    controls.getSession.mockResolvedValue({ data: { session: session("synthetic-b") } });
    act(() => { authListener("SIGNED_IN", session("synthetic-b")); });
    expect(app().user?.supabaseUid).toBe("synthetic-b");
    expect(app().cloudSyncOwnerId).toBe("synthetic-a");
    expect(app().cloudSyncQuarantined).toBe(true);
    expect(app().narrativeCache.week).toBe("Synthetic account A report");
    act(() => { setCloudSyncEnabled(true); app().saveNarrativeCache("new-week", "Synthetic B report"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(controls.fetch).not.toHaveBeenCalled();
  });

  it("revokes queued work on an auth identity change without requiring a sign-out event", async () => {
    await mount();
    act(() => { authListener("SIGNED_IN", session("synthetic-b")); });
    expect(isCloudSyncEnabled()).toBe(false);
    expect(app().cloudSyncQuarantined).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(controls.fetch).not.toHaveBeenCalled();
  });

  it("preserves same-account token refresh consent", async () => {
    await mount();
    act(() => { authListener("TOKEN_REFRESHED", session()); });
    expect(isCloudSyncEnabled()).toBe(true);
  });

  it("does not dispatch an effect whose session resolves after provider unmount", async () => {
    const lookup = deferred<{ data: { session: Session } }>();
    controls.getSession.mockReturnValue(lookup.promise);
    const view = render(<AppProvider><Probe /></AppProvider>);
    view.unmount();
    await act(async () => { lookup.resolve({ data: { session: session() } }); });
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    expect(controls.fetch).not.toHaveBeenCalled();
  });
});

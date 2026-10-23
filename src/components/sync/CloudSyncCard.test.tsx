// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CloudSyncCard } from "./CloudSyncCard";
import { isCloudSyncEnabled, setCloudSyncEnabled } from "../../lib/sync/cloudSync";

const { getSession, exportLocalDataBackup, importLocalDataBackup, mockFetch, appState } = vi.hoisted(() => ({
  getSession: vi.fn(),
  exportLocalDataBackup: vi.fn(),
  importLocalDataBackup: vi.fn(),
  mockFetch: vi.fn(),
  appState: { user: { supabaseUid: "synthetic-account-a" }, cloudSyncOwnerId: "synthetic-account-a", cloudSyncQuarantined: false },
}));

vi.mock("../../app/context/AppContext", () => ({
  useApp: () => ({ ...appState, exportLocalDataBackup, importLocalDataBackup }),
}));
vi.mock("../../utils/productAnalytics", () => ({ captureProductEvent: vi.fn() }));
vi.mock("../../utils/supabase/info", () => ({
  functionsBaseUrl: "https://example.test/functions/v1",
  publicAnonKey: "synthetic-anon-key",
  isSupabaseConfigured: () => true,
}));
vi.mock("../../utils/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: { getSession } }),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function response(ok = true, state: unknown = null) {
  return { ok, status: ok ? 200 : 503, json: async () => ({ state, version: 1 }) };
}

const session = { data: { session: { access_token: "synthetic-session", user: { id: "synthetic-account-a" } } } };

describe("CloudSyncCard consent feedback", () => {
  beforeEach(() => {
    localStorage.clear();
    appState.user = { supabaseUid: "synthetic-account-a" };
    appState.cloudSyncOwnerId = "synthetic-account-a";
    appState.cloudSyncQuarantined = false;
    setCloudSyncEnabled(false);
    getSession.mockReset().mockResolvedValue(session);
    exportLocalDataBackup.mockReset().mockReturnValue(JSON.stringify({ fixture: "synthetic-family" }));
    importLocalDataBackup.mockReset();
    // Every request is mocked. Unexpected requests fail instead of reaching a service.
    mockFetch.mockReset().mockRejectedValue(new Error("Unexpected synthetic request"));
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    setCloudSyncEnabled(false);
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("keeps failed opt-in off and explains that the preference was not saved", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage unavailable"); });
    render(<CloudSyncCard />);
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(isCloudSyncEnabled()).toBe(false);
    expect(screen.getByRole("status")).toHaveTextContent(/could not be enabled/i);
    expect(getSession).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("warns that an unsaved opt-out is only effective for this session", () => {
    setCloudSyncEnabled(true);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage unavailable"); });
    render(<CloudSyncCard />);
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(isCloudSyncEnabled()).toBe(false);
    expect(localStorage.getItem("neurospark_cloud_sync_enabled")).toBe("1");
    expect(screen.getByRole("status")).toHaveTextContent(/previous setting after a reload/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("allows an explicit successful opt-in retry after a failed write", async () => {
    const write = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage unavailable"); });
    render(<CloudSyncCard />);
    fireEvent.click(screen.getByRole("switch"));
    write.mockRestore();
    mockFetch.mockResolvedValueOnce(response());
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Sync now" })).toBeEnabled());
  });

  it("does not let a stale pull unlock a newer request after off/on", async () => {
    const oldPull = deferred<ReturnType<typeof response>>();
    const newPull = deferred<ReturnType<typeof response>>();
    mockFetch.mockReturnValueOnce(oldPull.promise).mockReturnValueOnce(newPull.promise);
    render(<CloudSyncCard />);
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    await act(async () => { oldPull.resolve(response()); });
    expect(screen.getByRole("button", { name: /Checking cloud/i })).toBeDisabled();
    await act(async () => { newPull.resolve(response(false)); });
    expect(screen.getByRole("button", { name: /Sync failed/i })).toBeEnabled();
  });

  it("ignores an old upload result after a new consent cycle fails", async () => {
    setCloudSyncEnabled(true);
    const oldPush = deferred<ReturnType<typeof response>>();
    mockFetch.mockReturnValueOnce(oldPush.promise).mockResolvedValueOnce(response(false));
    render(<CloudSyncCard />);
    fireEvent.click(screen.getByRole("button", { name: "Sync now" }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(screen.getByRole("button", { name: /Sync failed/i })).toBeEnabled());
    await act(async () => { oldPush.resolve(response()); });
    expect(screen.getByRole("button", { name: /Sync failed/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Uploaded|Synced/i })).not.toBeInTheDocument();
  });

  it("denies a suspended manual upload after opt-out and re-enable", async () => {
    setCloudSyncEnabled(true);
    const oldSession = deferred<typeof session>();
    getSession.mockReturnValueOnce(oldSession.promise).mockResolvedValueOnce(session);
    mockFetch.mockResolvedValueOnce(response());
    render(<CloudSyncCard />);
    fireEvent.click(screen.getByRole("button", { name: "Sync now" }));
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    await act(async () => { oldSession.resolve(session); });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][1].method).toBe("GET");
    expect(screen.getByRole("button", { name: "Sync now" })).toBeEnabled();
  });

  it("surfaces backup serialization failure and permits retry", async () => {
    setCloudSyncEnabled(true);
    exportLocalDataBackup.mockReturnValueOnce("not JSON");
    mockFetch.mockResolvedValueOnce(response());
    render(<CloudSyncCard />);
    fireEvent.click(screen.getByRole("button", { name: "Sync now" }));
    const retry = await screen.findByRole("button", { name: /Sync failed/i });
    expect(retry).toBeEnabled();
    expect(mockFetch).not.toHaveBeenCalled();
    fireEvent.click(retry);
    await waitFor(() => expect(screen.getByRole("button", { name: /Uploaded/i })).toBeEnabled());
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not export a backup after consent was revoked outside this render", () => {
    setCloudSyncEnabled(true);
    render(<CloudSyncCard />);
    act(() => { setCloudSyncEnabled(false); });
    expect(exportLocalDataBackup).not.toHaveBeenCalled();
    expect(getSession).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("revokes sync without sending a snapshot when session ownership changes", async () => {
    setCloudSyncEnabled(true);
    getSession.mockResolvedValueOnce({ data: { session: { access_token: "synthetic-b", user: { id: "synthetic-account-b" } } } });
    render(<CloudSyncCard />);
    fireEvent.click(screen.getByRole("button", { name: "Sync now" }));
    await waitFor(() => expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false"));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(/matching signed-in account/i);
  });

  it("does not pull with a missing authenticated session", async () => {
    getSession.mockResolvedValueOnce({ data: { session: null } });
    render(<CloudSyncCard />);
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/matching signed-in account/i));
    expect(isCloudSyncEnabled()).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("cannot opt account B into uploading account A's quarantined local family", () => {
    appState.user = { supabaseUid: "synthetic-account-b" };
    appState.cloudSyncQuarantined = true;
    render(<CloudSyncCard />);
    expect(screen.getByRole("status")).toHaveTextContent(/does not have verified ownership/i);
    fireEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("status")).toHaveTextContent(/does not have verified ownership/i);
    expect(getSession).not.toHaveBeenCalled();
    expect(exportLocalDataBackup).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("never applies an old account's pull response after an identity transition", async () => {
    const oldPull = deferred<ReturnType<typeof response>>();
    mockFetch.mockReturnValueOnce(oldPull.promise);
    const view = render(<CloudSyncCard />);
    fireEvent.click(screen.getByRole("switch"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    act(() => { setCloudSyncEnabled(false); });
    appState.user = { supabaseUid: "synthetic-account-b" };
    appState.cloudSyncQuarantined = true;
    view.rerender(<CloudSyncCard />);
    await act(async () => { oldPull.resolve(response(true, { fixture: "old-account-a" })); });
    expect(importLocalDataBackup).not.toHaveBeenCalled();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("status")).toHaveTextContent(/does not have verified ownership/i);
    expect(screen.queryByRole("button", { name: /Uploaded|Synced/i })).not.toBeInTheDocument();
  });

  it("does not dispatch a suspended pull after opt-out and unmount", async () => {
    const pendingSession = deferred<typeof session>();
    getSession.mockReturnValueOnce(pendingSession.promise);
    const { unmount } = render(<CloudSyncCard />);
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("switch"));
    unmount();
    await act(async () => { pendingSession.resolve(session); });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(isCloudSyncEnabled()).toBe(false);
  });

  it("does not describe opting out as deletion or recall", () => {
    render(<CloudSyncCard />);
    expect(screen.getByText(/doesn’t delete earlier uploads/i)).toBeInTheDocument();
    expect(screen.queryByText(/everything stays only on this device/i)).not.toBeInTheDocument();
  });
});

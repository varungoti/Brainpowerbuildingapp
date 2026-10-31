// ============================================================================
// CloudSyncCard
// ----------------------------------------------------------------------------
// Profile-screen card to opt into cloud sync. We deliberately keep the
// surface small: one toggle + one "sync now" button + plain-language
// explanation that local-first is the default.
//
// AppContext owns debounced uploads. Opt-in checks the cloud endpoint but does
// not import its response. Local backup restoration remains an explicit action.
// ============================================================================

import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../../app/context/AppContext";
import {
  isCloudSyncEnabled,
  setCloudSyncEnabled,
  captureCloudSyncOperation,
  getOwnedCloudSyncJwt,
  isCloudSyncOperationCurrent,
  subscribeCloudSyncEnabled,
  pushStateNow,
  pullState,
} from "../../lib/sync/cloudSync";
import { isSupabaseConfigured } from "../../utils/supabase/info";
import { getSupabaseBrowserClient } from "../../utils/supabase/client";
import { getCloudSyncSnapshotOwner } from "../../lib/sync/cloudSyncOwnership";

async function getJwt(snapshotOwnerId: string | null | undefined): Promise<string | null> {
  if (!snapshotOwnerId) return null;
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return getOwnedCloudSyncJwt(snapshotOwnerId, data.session);
  } catch {
    return null;
  }
}

export function CloudSyncCard() {
  const app = useApp();
  const [enabled, setEnabled] = useState(() => isCloudSyncEnabled());
  const [busy, setBusy] = useState<"idle" | "push" | "pull" | "ok" | "err">("idle");
  const [preferenceWarning, setPreferenceWarning] = useState<string | null>(null);
  const requestGeneration = useRef(0);
  const ownershipWarning = getCloudSyncSnapshotOwner(app) ? null
    : "Cloud sync is paused because this device’s family data does not have verified ownership for the signed-in account. Your local data and backups are preserved; signing in or toggling sync cannot transfer it to another account.";

  useEffect(() => {
    const unsubscribe = subscribeCloudSyncEnabled(() => {
      requestGeneration.current += 1;
      setEnabled(isCloudSyncEnabled());
      setBusy("idle");
    });
    return () => {
      requestGeneration.current += 1;
      unsubscribe();
    };
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        Cloud sync requires Supabase to be configured (set <code>VITE_SUPABASE_PROJECT_ID</code>).
        Until then we keep all data local-first on this device.
      </div>
    );
  }

  const handleToggle = async () => {
    // Invalidate earlier completions even when the new preference cannot persist.
    const next = !isCloudSyncEnabled();
    const snapshotOwnerId = getCloudSyncSnapshotOwner(app);
    if (next && !snapshotOwnerId) {
      setCloudSyncEnabled(false);
      setPreferenceWarning(ownershipWarning);
      return;
    }
    const preference = setCloudSyncEnabled(next);
    const request = ++requestGeneration.current;
    setEnabled(preference.enabled);
    setBusy("idle");
    setPreferenceWarning(preference.persisted ? null : next
      ? "Cloud sync could not be enabled because this device could not save the preference. Please try again."
      : "Cloud sync is off for this session, but this device could not save the preference. It may return to the previous setting after a reload. Check this setting again after reloading.");
    if (preference.enabled) {
      const syncOperation = captureCloudSyncOperation();
      setBusy("pull");
      const jwt = await getJwt(snapshotOwnerId);
      if (request !== requestGeneration.current || !isCloudSyncOperationCurrent(syncOperation)) return;
      if (!jwt) {
        setCloudSyncEnabled(false);
        setPreferenceWarning("Cloud sync stopped because this device’s saved family does not have a matching signed-in account. Sign in to that account before enabling sync.");
        return;
      }
      const r = await pullState(jwt, syncOperation);
      if (request === requestGeneration.current) setBusy(r.ok ? "idle" : "err");
    }
  };

  const handleSyncNow = async () => {
    const request = ++requestGeneration.current;
    const syncOperation = captureCloudSyncOperation();
    const snapshotOwnerId = getCloudSyncSnapshotOwner(app);
    if (!syncOperation || !snapshotOwnerId) {
      if (!snapshotOwnerId) setCloudSyncEnabled(false);
      setEnabled(false);
      setBusy("idle");
      return;
    }
    setBusy("push");
    try {
      const snapshot = JSON.parse(app.exportLocalDataBackup()) as unknown;
      const jwt = await getJwt(snapshotOwnerId);
      if (request !== requestGeneration.current || !isCloudSyncOperationCurrent(syncOperation)) return;
      if (!jwt) {
        setCloudSyncEnabled(false);
        setPreferenceWarning("Cloud sync stopped because this device’s saved family does not have a matching signed-in account. Sign in to that account before enabling sync.");
        return;
      }
      const r = await pushStateNow(snapshot, jwt, syncOperation);
      if (request === requestGeneration.current) setBusy(r.ok ? "ok" : "err");
    } catch {
      if (request === requestGeneration.current) setBusy("err");
    }
  };

  return (
    <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleToggle}
          role="switch"
          aria-label="Sync this device with my account"
          aria-checked={enabled}
          className="relative w-9 h-5 rounded-full flex-shrink-0 transition mt-0.5"
          style={{ background: enabled ? "#4361EE" : "#CBD5E1" }}
        >
          <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: enabled ? 18 : 2 }} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-slate-800 text-sm font-bold">Sync this device with my account</div>
          <div className="text-slate-500 text-xs leading-relaxed mt-0.5">
            Cloud sync uploads this device’s progress and child profiles to your account via Supabase.
            It’s off by default. Turning it off stops new sync requests; it doesn’t delete earlier uploads
            or recall requests already sent. Backup & restore is always available.
          </div>
        </div>
      </div>

      {(preferenceWarning || ownershipWarning) && <p role="status" className="text-xs text-amber-800">{preferenceWarning || ownershipWarning}</p>}

      {enabled && (
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={busy === "push" || busy === "pull"}
          className="w-full py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
        >
          {busy === "push"
            ? "Pushing…"
            : busy === "pull"
            ? "Checking cloud…"
            : busy === "ok"
            ? "✓ Uploaded"
            : busy === "err"
            ? "Sync failed — retry"
            : "Sync now"}
        </button>
      )}
    </div>
  );
}

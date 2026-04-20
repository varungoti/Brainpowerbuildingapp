// ============================================================================
// CloudSyncCard
// ----------------------------------------------------------------------------
// Profile-screen card to opt into cloud sync. We deliberately keep the
// surface small: one toggle + one "sync now" button + plain-language
// explanation that local-first is the default.
//
// The actual reconciliation is done by AppContext (debounced push on every
// state mutation, manual pull on first opt-in). Here we only own UI state
// and the user's stored preference.
// ============================================================================

import React, { useState } from "react";
import { useApp } from "../../app/context/AppContext";
import {
  isCloudSyncEnabled,
  setCloudSyncEnabled,
  pushStateNow,
  pullState,
} from "../../lib/sync/cloudSync";
import { isSupabaseConfigured } from "../../utils/supabase/info";
import { getSupabaseBrowserClient } from "../../utils/supabase/client";

async function getJwt(): Promise<string | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function CloudSyncCard() {
  const app = useApp();
  const [enabled, setEnabled] = useState(() => isCloudSyncEnabled());
  const [busy, setBusy] = useState<"idle" | "push" | "pull" | "ok" | "err">("idle");

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        Cloud sync requires Supabase to be configured (set <code>VITE_SUPABASE_PROJECT_ID</code>).
        Until then we keep all data local-first on this device.
      </div>
    );
  }

  const handleToggle = async () => {
    const next = !enabled;
    setEnabled(next);
    setCloudSyncEnabled(next);
    if (next) {
      setBusy("pull");
      const r = await pullState(await getJwt());
      setBusy(r.ok ? "ok" : "err");
    }
  };

  const handleSyncNow = async () => {
    setBusy("push");
    const snapshot = JSON.parse(app.exportLocalDataBackup()) as unknown;
    const r = await pushStateNow(snapshot, await getJwt());
    setBusy(r.ok ? "ok" : "err");
  };

  return (
    <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          role="switch"
          aria-checked={enabled}
          className="relative w-9 h-5 rounded-full flex-shrink-0 transition mt-0.5"
          style={{ background: enabled ? "#4361EE" : "#CBD5E1" }}
        >
          <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all" style={{ left: enabled ? 18 : 2 }} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-slate-800 text-sm font-bold">Sync this device with my account</div>
          <div className="text-slate-500 text-xs leading-relaxed mt-0.5">
            On: progress and child profiles sync between your devices via Supabase.
            Off (default): everything stays only on this device. Backup & restore is always available.
          </div>
        </div>
      </div>

      {enabled && (
        <button
          onClick={handleSyncNow}
          disabled={busy === "push" || busy === "pull"}
          className="w-full py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
        >
          {busy === "push"
            ? "Pushing…"
            : busy === "pull"
            ? "Pulling latest…"
            : busy === "ok"
            ? "✓ Synced"
            : busy === "err"
            ? "Sync failed — retry"
            : "Sync now"}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// OfflinePackButton
// ----------------------------------------------------------------------------
// "Download this week" button that persists the current pack (plus any
// referenced material lists) to IndexedDB via offlinePackManager so the
// child can complete activities during a school run / no-internet trip.
// ============================================================================

import React, { useState } from "react";
import type { Activity } from "../../app/data/activities";
import { savePack, getPack, addDays } from "../../lib/offline/offlinePackManager";

interface Props {
  pack: Activity[];
  childId: string;
}

export function OfflinePackButton({ pack, childId }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  if (!pack || pack.length === 0) return null;

  const handleDownload = async () => {
    setStatus("saving");
    try {
      const id = `pack-${childId}-${Date.now()}`;
      await savePack({
        id,
        childId,
        generatedAt: new Date().toISOString(),
        expiresAt: addDays(new Date(), 7).toISOString(),
        activities: pack,
      });
      const cached = await getPack(childId);

      try {
        const reg = await navigator.serviceWorker?.ready;
        if (reg?.active) {
          const urls = pack.flatMap((a) => {
            const out: string[] = [];
            const maybeUrl = (a as unknown as { imageUrl?: unknown }).imageUrl;
            if (typeof maybeUrl === "string") out.push(maybeUrl);
            return out;
          });
          if (urls.length > 0) reg.active.postMessage({ type: "PREFETCH_PACK_ASSETS", urls });
        }
      } catch {
        /* SW prefetch best-effort */
      }

      setStatus(cached ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={status === "saving"}
      className="w-full bg-white rounded-2xl border-2 border-slate-200 p-3 flex items-center gap-3 active:scale-[0.99] transition disabled:opacity-60"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base" style={{ background: "#EEF1FF" }}>
        ⬇️
      </div>
      <div className="flex-1 text-left">
        <div className="font-bold text-slate-900 text-sm leading-tight">
          {status === "saved" ? "Saved for offline use" : "Download this week's pack"}
        </div>
        <div className="text-xs text-slate-500">
          {status === "saved"
            ? "Activities stored on this device for 7 days."
            : status === "error"
            ? "Download failed — try again later."
            : `${pack.length} activities · works without internet.`}
        </div>
      </div>
      <span className="text-xs font-bold text-indigo-600">
        {status === "saving" ? "…" : status === "saved" ? "✓" : "Save"}
      </span>
    </button>
  );
}

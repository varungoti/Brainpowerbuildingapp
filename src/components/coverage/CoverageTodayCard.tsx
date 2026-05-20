import React, { useEffect, useState } from "react";
import { functionsBaseUrl, isSupabaseConfigured } from "@/utils/supabase/info";
import { getSupabaseBrowserClient } from "@/utils/supabase/client";

interface CoverageSummary {
  totalSeconds: number;
  byPartner: Array<{ displayName: string; seconds: number; events: number }>;
}

function formatMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  return m < 1 ? "<1 min" : `${m} min`;
}

export function CoverageTodayCard({ childId }: { childId: string }) {
  const [summary, setSummary] = useState<CoverageSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!childId || !isSupabaseConfigured() || !functionsBaseUrl) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const client = getSupabaseBrowserClient();
        const { data: session } = await client.auth.getSession();
        const token = session.session?.access_token;
        if (!token) return;
        const url = new URL(`${functionsBaseUrl}/coverage/summary`);
        url.searchParams.set("childId", childId);
        url.searchParams.set("hours", "24");
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const body = (await res.json()) as CoverageSummary;
        if (alive) setSummary(body);
      } catch {
        /* optional surface — never block home */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [childId]);

  if (loading || !summary || summary.totalSeconds <= 0) return null;

  const top = summary.byPartner[0];

  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        background: "rgba(56, 189, 248, 0.12)",
        border: "1px solid rgba(56, 189, 248, 0.35)",
      }}
    >
      <div className="text-sky-200 text-xs font-semibold uppercase tracking-wide mb-1">
        Partner coverage today
      </div>
      <div className="text-white text-sm font-bold">
        {formatMinutes(summary.totalSeconds)} credited from external activities
      </div>
      {top && (
        <div className="text-white/60 text-xs mt-1">
          Top: {top.displayName} · {formatMinutes(top.seconds)}
        </div>
      )}
    </div>
  );
}

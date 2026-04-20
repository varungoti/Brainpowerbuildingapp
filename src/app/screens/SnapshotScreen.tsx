import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { buildSnapshotData, downloadSnapshotPdf } from "../../lib/clinical/wellChildSnapshot";
import { listSnapshots, saveSnapshot, type SnapshotListItem } from "../../lib/clinical/snapshotClient";

export const SnapshotScreen: React.FC = () => {
  const { activeChild, children, activityLogs, navigate } = useApp();
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(activeChild?.id);
  useEffect(() => { setSelectedChildId(activeChild?.id ?? children[0]?.id); }, [activeChild?.id, children]);
  const child = children.find((c) => c.id === selectedChildId);

  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<SnapshotListItem[]>([]);

  async function refresh() {
    if (!child) return;
    setHistory(await listSnapshots(child.id));
  }
  useEffect(() => { void refresh(); }, [child?.id]);

  const childLogs = useMemo(
    () => activityLogs.filter((l) => l.childId === child?.id),
    [activityLogs, child?.id],
  );

  const data = useMemo(() => (child ? buildSnapshotData(child, childLogs, []) : null), [child, childLogs]);

  async function generate() {
    if (!data) return;
    setBusy(true);
    try {
      const r = await saveSnapshot(data);
      downloadSnapshotPdf(data);
      if (!r) {
        window.alert("Snapshot generated but couldn't sync to cloud — partners won't be able to fetch this exact one until you re-save online.");
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!child || !data) {
    return <div className="p-5 text-sm text-gray-600">Add a child to generate a well-child snapshot.</div>;
  }

  return (
    <div className="overflow-y-auto h-full pb-12">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">Well-child snapshot</h1>
        <p className="text-xs text-gray-600 mt-1">
          One-page neurodevelopmental observation for {child.name}'s pediatric visit. Bayesian posteriors of milestone acquisition + brain-region practice volume, last 30 days. Always carries the "developmental, not diagnostic" disclaimer.
        </p>
      </div>

      {children.length > 1 && (
        <div className="px-5 mb-3">
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            {children.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
      )}

      <section className="px-5 mb-4">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-900">
          Anchor visit: <b>{data.anchor} months</b>. Practice volume last 30 days: <b>{data.totalPracticeMinutes} min</b> across {data.topRegions.length} regions. {data.predictions.length} milestones included.
        </div>
      </section>

      <section className="px-5 mb-4">
        <button
          onClick={generate}
          disabled={busy}
          className="w-full rounded-3xl bg-indigo-500 text-white py-4 text-sm font-bold disabled:opacity-50"
        >{busy ? "Generating…" : "Generate PDF + save snapshot"}</button>
        <p className="text-xs text-gray-500 mt-2 text-center">Print, save as PDF, or hand to your pediatrician. Saved snapshots back the partner integration.</p>
      </section>

      <section className="px-5 mb-4">
        <button
          onClick={() => navigate("snapshot_shares")}
          className="w-full rounded-2xl bg-white border border-gray-200 text-gray-900 py-3 text-sm font-semibold"
        >
          Manage pediatrician share links →
        </button>
      </section>

      <section className="px-5 pb-6">
        <div className="text-xs font-semibold text-gray-700 mb-2">Saved snapshots</div>
        {history.length === 0 && <div className="text-xs text-gray-500">None yet.</div>}
        <div className="space-y-2">
          {history.map((s) => (
            <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-3 text-xs">
              <div className="font-semibold text-gray-900">{new Date(s.generated_at).toLocaleString()}</div>
              <div className="text-gray-600 mt-1">Anchor {s.anchor_months} mo · age {s.child_age_months} mo · {s.total_practice_minutes} min practice</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

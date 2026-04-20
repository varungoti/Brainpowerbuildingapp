import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { createPartnerShare, listPartnerShares, revokePartnerShare, type PartnerShare } from "../../lib/clinical/snapshotClient";

function shareUrl(token: string): string {
  const base = (import.meta.env.VITE_PARTNERS_BASE_URL ?? "").toString() || "https://partners.neurospark.com";
  return `${base.replace(/\/$/, "")}/snapshot?token=${encodeURIComponent(token)}`;
}

export const SnapshotSharesScreen: React.FC = () => {
  const { activeChild, children } = useApp();
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(activeChild?.id);
  useEffect(() => { setSelectedChildId(activeChild?.id ?? children[0]?.id); }, [activeChild?.id, children]);
  const child = children.find((c) => c.id === selectedChildId);

  const [items, setItems] = useState<PartnerShare[]>([]);
  const [busy, setBusy] = useState(false);
  const [ttlDays, setTtlDays] = useState(30);

  async function refresh() {
    if (!child) return;
    setItems(await listPartnerShares(child.id));
  }
  useEffect(() => { void refresh(); }, [child?.id]);

  async function create() {
    if (!child) return;
    setBusy(true);
    try {
      const r = await createPartnerShare(child.id, ttlDays);
      if (!r) window.alert("Couldn't create share. Try again.");
      else await refresh();
    } finally { setBusy(false); }
  }

  async function revoke(token: string) {
    if (!window.confirm("Revoke this link? Partners using it will lose access immediately.")) return;
    const ok = await revokePartnerShare(token);
    if (ok) await refresh();
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      window.alert("Copied.");
    } catch {
      window.prompt("Copy this link", text);
    }
  }

  if (!child) return <div className="p-5 text-sm text-gray-600">Add a child to issue share links.</div>;

  return (
    <div className="overflow-y-auto h-full pb-12">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">Pediatrician share links</h1>
        <p className="text-xs text-gray-600 mt-1">
          Issue a revocable, time-limited link so a pediatrician or employer-benefit platform can fetch your latest snapshot. They never see other data.
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
        <div className="rounded-2xl border border-gray-200 bg-white p-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">New share link</div>
          <label className="text-xs text-gray-700 block">
            Expires in
            <select
              value={ttlDays}
              onChange={(e) => setTtlDays(parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded border border-gray-200 px-2 py-2 text-sm"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </label>
          <button onClick={create} disabled={busy} className="mt-3 w-full rounded-2xl bg-indigo-500 text-white py-3 text-sm font-semibold disabled:opacity-50">
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </section>

      <section className="px-5 pb-6">
        <div className="text-xs font-semibold text-gray-700 mb-2">Active links</div>
        {items.length === 0 && <div className="text-xs text-gray-500">No share links yet.</div>}
        <div className="space-y-2">
          {items.map((s) => {
            const url = shareUrl(s.token);
            const isRevoked = !!s.revoked_at;
            const isExpired = s.expires_at && new Date(s.expires_at).getTime() < Date.now();
            return (
              <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-3">
                <div className="text-xs text-gray-700 break-all">{url}</div>
                <div className="text-[11px] text-gray-500 mt-2">
                  Issued {new Date(s.created_at).toLocaleDateString()}
                  {s.expires_at ? ` · expires ${new Date(s.expires_at).toLocaleDateString()}` : ""}
                  {isRevoked ? " · revoked" : isExpired ? " · expired" : " · active"}
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => copy(url)} className="px-3 py-1 rounded-xl bg-gray-100 text-xs text-gray-700">Copy</button>
                  {!isRevoked && !isExpired && (
                    <button onClick={() => revoke(s.token)} className="px-3 py-1 rounded-xl bg-rose-500 text-white text-xs">Revoke</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

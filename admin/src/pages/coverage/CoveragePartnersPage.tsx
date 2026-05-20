import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, Loader2, PauseCircle, Plus, RefreshCw, Server } from "lucide-react";
import { api } from "../../lib/api.ts";

type Partner = {
  id: string;
  slug: string;
  display_name: string;
  contact_email: string;
  daily_minutes_cap_per_child: number;
  rpm_limit: number;
  disabled_at: string | null;
  created_at: string;
  notes: string | null;
};
type CreateResp = { data: { id: string; slug: string }; signingSecret: string };
type RotateResp = { signingSecret: string };

export const CoveragePartnersPage: React.FC = () => {
  const qc = useQueryClient();
  const partners = useQuery({
    queryKey: ["coverage-partners"],
    queryFn: () => api<{ data: Partner[] }>("/admin/coverage/partners").then((r) => r.data),
  });
  const recent = useQuery({
    queryKey: ["coverage-recent"],
    queryFn: () => api<{ data: Array<{ id: number; child_id: string; duration_seconds: number; brain_region: string | null; modality: string; signed_at: string }> }>("/admin/coverage/recent?limit=50").then((r) => r.data),
  });
  const [showSecret, setShowSecret] = useState<Record<string, string | null>>({});
  const [createOpen, setCreateOpen] = useState(false);

  const create = useMutation({
    mutationFn: (input: { slug: string; displayName: string; contactEmail: string; dailyMinutesCapPerChild: number; rpmLimit: number; notes?: string }) =>
      api<CreateResp>("/admin/coverage/partners", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: (data) => {
      setShowSecret((s) => ({ ...s, [data.data.id]: data.signingSecret }));
      void qc.invalidateQueries({ queryKey: ["coverage-partners"] });
      setCreateOpen(false);
    },
  });
  const rotate = useMutation({
    mutationFn: (id: string) => api<RotateResp>(`/admin/coverage/partners/${id}/rotate`, { method: "POST" }),
    onSuccess: (data, id) => setShowSecret((s) => ({ ...s, [id]: data.signingSecret })),
  });
  const disable = useMutation({
    mutationFn: (id: string) => api<{ ok: true }>(`/admin/coverage/partners/${id}/disable`, { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["coverage-partners"] }),
  });

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-extrabold text-3xl mb-1">Coverage partners</h1>
          <p className="text-slate-600 max-w-2xl">
            Third-party experiences (Roblox plugins, daycare portals, sibling co-play, school iPad apps) that grant brain-region + AI-age-competency credit via signed
            <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-xs">POST /coverage/credit</code>.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-semibold text-sm"
        >
          <Plus className="w-4 h-4" /> New partner
        </button>
      </div>

      {createOpen && (
        <CreatePartnerForm
          onCancel={() => setCreateOpen(false)}
          onSubmit={(input) => create.mutate(input)}
          submitting={create.isPending}
        />
      )}

      <section>
        <h2 className="font-bold text-lg mb-3">Registered partners</h2>
        {partners.isLoading ? (
          <div className="flex items-center gap-2 text-slate-600"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
        ) : (
          <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Daily cap</th>
                  <th className="px-4 py-3 font-semibold">RPM</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {(partners.data ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-mono text-xs">{p.slug}</td>
                    <td className="px-4 py-3">{p.display_name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.contact_email}</td>
                    <td className="px-4 py-3">{p.daily_minutes_cap_per_child} min/child</td>
                    <td className="px-4 py-3">{p.rpm_limit}</td>
                    <td className="px-4 py-3">
                      {p.disabled_at ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">Disabled</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => rotate.mutate(p.id)}
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                        title="Rotate signing secret"
                      ><RefreshCw className="w-3 h-3" /> Rotate</button>
                      {!p.disabled_at && (
                        <button
                          onClick={() => disable.mutate(p.id)}
                          className="text-xs text-amber-700 hover:underline inline-flex items-center gap-1"
                        ><PauseCircle className="w-3 h-3" /> Disable</button>
                      )}
                    </td>
                  </tr>
                ))}
                {!partners.data?.length && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">No partners yet — create one to start crediting third-party coverage.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {Object.entries(showSecret).filter(([, v]) => v).map(([id, secret]) => (
          <div key={id} className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <strong className="text-amber-900">One-time signing secret</strong>
                <span className="text-amber-700"> for partner <code className="font-mono">{id}</code> — copy now, it will not be shown again.</span>
              </div>
              <button
                onClick={() => setShowSecret((s) => ({ ...s, [id]: null }))}
                className="text-amber-900"
                aria-label="Hide"
              ><EyeOff className="w-4 h-4" /></button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 font-mono text-xs bg-white p-2 rounded border border-amber-200 break-all">{secret}</code>
              <button
                onClick={() => navigator.clipboard.writeText(secret ?? "")}
                className="bg-amber-600 text-white text-xs px-3 py-2 rounded-lg inline-flex items-center gap-1"
              ><Copy className="w-3 h-3" /> Copy</button>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Server className="w-4 h-4" /> Recent credits</h2>
        <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Child</th>
                <th className="px-4 py-3 font-semibold">Duration</th>
                <th className="px-4 py-3 font-semibold">Region</th>
                <th className="px-4 py-3 font-semibold">Modality</th>
              </tr>
            </thead>
            <tbody>
              {(recent.data ?? []).map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-600 text-xs">{new Date(r.signed_at).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.child_id}</td>
                  <td className="px-4 py-3">{Math.round(r.duration_seconds / 60)} min</td>
                  <td className="px-4 py-3">{r.brain_region ?? "—"}</td>
                  <td className="px-4 py-3">{r.modality}</td>
                </tr>
              ))}
              {!recent.data?.length && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No credits in the last 24h.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const CreatePartnerForm: React.FC<{
  onCancel: () => void;
  onSubmit: (input: { slug: string; displayName: string; contactEmail: string; dailyMinutesCapPerChild: number; rpmLimit: number; notes?: string }) => void;
  submitting: boolean;
}> = ({ onCancel, onSubmit, submitting }) => {
  const [form, setForm] = useState({ slug: "", displayName: "", contactEmail: "", dailyMinutesCapPerChild: 60, rpmLimit: 600, notes: "" });
  return (
    <form
      className="bg-white rounded-2xl shadow border border-slate-200 p-5 grid grid-cols-2 gap-3"
      onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, notes: form.notes || undefined }); }}
    >
      <label className="text-xs font-semibold col-span-1">
        Slug<input className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="roblox-edu" required />
      </label>
      <label className="text-xs font-semibold col-span-1">
        Display name<input className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
      </label>
      <label className="text-xs font-semibold col-span-2">
        Contact email<input className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required />
      </label>
      <label className="text-xs font-semibold">
        Daily cap (min/child)<input className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min={1} max={1440} value={form.dailyMinutesCapPerChild} onChange={(e) => setForm({ ...form, dailyMinutesCapPerChild: Number(e.target.value) })} />
      </label>
      <label className="text-xs font-semibold">
        Rate limit (req/min)<input className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" min={1} max={6000} value={form.rpmLimit} onChange={(e) => setForm({ ...form, rpmLimit: Number(e.target.value) })} />
      </label>
      <label className="text-xs font-semibold col-span-2">
        Notes<textarea className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </label>
      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="text-sm text-slate-600 px-3 py-2">Cancel</button>
        <button type="submit" disabled={submitting} className="text-sm bg-primary text-white px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2">
          {submitting && <Loader2 className="w-3 h-3 animate-spin" />} Create
        </button>
      </div>
    </form>
  );
};

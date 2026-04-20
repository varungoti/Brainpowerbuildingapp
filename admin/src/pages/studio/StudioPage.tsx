import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clapperboard, Loader2, PlayCircle, Plus } from "lucide-react";
import { api } from "../../lib/api.ts";

interface Template {
  id: string;
  aspect: string;
  durationGuide: number;
  description: string;
}

interface Job {
  id: string;
  template: string;
  brief: string;
  status: string;
  title?: string;
  costUSD: number;
  thumbnailUrl?: string;
  mp4Url?: string;
  createdAt: string;
}

const VOICES = [
  { id: "af_heart", label: "Warm female (af_heart)" },
  { id: "am_michael", label: "Warm male (am_michael)" },
  { id: "bf_isabella", label: "Calm narrator (bf_isabella)" },
  { id: "af_jessica", label: "Kid-friendly (af_jessica)" },
];

export const StudioPage: React.FC = () => {
  const qc = useQueryClient();
  const templates = useQuery({
    queryKey: ["studio-templates"],
    queryFn: () => api<Template[]>("/admin/studio/templates"),
  });
  const jobs = useQuery({
    queryKey: ["studio-jobs"],
    queryFn: () => api<Job[]>("/admin/studio/jobs"),
    refetchInterval: 5000,
  });
  const cost = useQuery({
    queryKey: ["studio-cost"],
    queryFn: () => api<{ spendUSD: number; capUSD: number }>("/admin/studio/cost/month").catch(() => null),
  });

  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold flex items-center gap-3">
          <Clapperboard className="text-primary" /> AI Video Studio
        </h1>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> New video
        </button>
      </div>
      {cost.data ? (
        <div className="card flex justify-between items-center">
          <div>
            <div className="text-sm text-slate-500">Month-to-date spend</div>
            <div className="text-2xl font-display font-bold">
              ${cost.data.spendUSD.toFixed(2)}{" "}
              <span className="text-sm text-slate-500">/ ${cost.data.capUSD}</span>
            </div>
          </div>
          <div className="w-1/2 h-2 bg-slate-200 rounded">
            <div
              className="h-full bg-primary rounded"
              style={{ width: `${Math.min(100, (cost.data.spendUSD / cost.data.capUSD) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(jobs.data ?? []).map((j) => (
          <a
            key={j.id}
            href={`#studio/${j.id}`}
            className="card hover:shadow-md transition relative"
          >
            <div className="aspect-video rounded-xl bg-slate-100 overflow-hidden mb-3">
              {j.thumbnailUrl ? (
                <img src={j.thumbnailUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-slate-400">
                  {j.status === "rendering" || j.status === "generating_assets" ? (
                    <Loader2 className="animate-spin w-8 h-8" />
                  ) : (
                    <Clapperboard className="w-10 h-10" />
                  )}
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500">{j.template}</div>
            <div className="font-semibold truncate">{j.title ?? j.brief}</div>
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span className={statusClass(j.status)}>{j.status}</span>
              <span>${j.costUSD.toFixed(3)}</span>
            </div>
          </a>
        ))}
      </div>
      {open ? (
        <NewJobModal
          templates={templates.data ?? []}
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            qc.invalidateQueries({ queryKey: ["studio-jobs"] });
          }}
        />
      ) : null}
    </div>
  );
};

function statusClass(s: string) {
  if (s === "completed") return "pill bg-green-100 text-green-700";
  if (s === "failed") return "pill bg-red-100 text-red-700";
  if (s === "awaiting_approval") return "pill bg-amber-100 text-amber-700";
  return "pill bg-slate-100 text-slate-700";
}

const NewJobModal: React.FC<{
  templates: Template[];
  onClose: () => void;
  onCreated: () => void;
}> = ({ templates, onClose, onCreated }) => {
  const [form, setForm] = useState({
    template: templates[0]?.id ?? "BrainStoryShort",
    brief: "",
    durationSec: 30,
    voice: "af_heart",
    variant: "dark" as "light" | "dark",
  });
  const create = useMutation({
    mutationFn: () =>
      api("/admin/studio/jobs", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: onCreated,
  });

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-10" onClick={onClose}>
      <div className="card w-[560px] space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl font-extrabold">New AI video</h2>
        <Field label="Template">
          <select
            className="input w-full"
            value={form.template}
            onChange={(e) => {
              const t = templates.find((x) => x.id === e.target.value);
              setForm({
                ...form,
                template: e.target.value,
                durationSec: t?.durationGuide ?? form.durationSec,
              });
            }}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} — {t.description}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Brief (the prompt your script will be drafted from)">
          <textarea
            className="input w-full h-32"
            value={form.brief}
            onChange={(e) => setForm({ ...form, brief: e.target.value })}
            placeholder="e.g. Show how 4-year-olds build working memory by playing a 5-min sorting game with their parent. Hopeful tone."
          />
        </Field>
        <div className="flex gap-3">
          <Field label="Duration (s)">
            <input
              type="number"
              className="input w-24"
              value={form.durationSec}
              onChange={(e) => setForm({ ...form, durationSec: Number(e.target.value) })}
            />
          </Field>
          <Field label="Voice">
            <select
              className="input"
              value={form.voice}
              onChange={(e) => setForm({ ...form, voice: e.target.value })}
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Variant">
            <select
              className="input"
              value={form.variant}
              onChange={(e) => setForm({ ...form, variant: e.target.value as "light" | "dark" })}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!form.brief || create.isPending}
            onClick={() => create.mutate()}
          >
            <PlayCircle className="w-4 h-4" />
            {create.isPending ? "Drafting…" : "Draft script"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="text-xs text-slate-600 flex flex-col gap-1">
    {label}
    {children}
  </label>
);

import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Loader2, Megaphone, RefreshCw, XCircle } from "lucide-react";
import { api } from "../../lib/api.ts";

interface Scene {
  idx: number;
  durationSec: number;
  voiceoverText: string;
  imagePrompt: string;
  brandConsistency?: "high" | "low";
  textInImage?: boolean;
  motion?: string;
  useVideoClip?: boolean;
  imageProvider?: string;
  videoProvider?: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface Job {
  id: string;
  template: string;
  brief: string;
  durationSec: number;
  status: string;
  title?: string;
  subtitle?: string;
  scenes: Scene[];
  voiceoverUrl?: string;
  mp4Url?: string;
  thumbnailUrl?: string;
  costUSD: number;
  error?: string;
  createdAt: string;
}

const IMAGE_PROVIDERS = [
  "ideogram",
  "flux_pro",
  "recraft",
  "openai_gpt_image",
  "google_imagen4",
  "stability_sd35",
  "leonardo",
  "midjourney",
  "replicate",
  "fal",
  "together",
  "sdxl_self",
  "comfy_self",
];
const VIDEO_PROVIDERS = [
  "runway_gen4",
  "openai_sora2",
  "google_veo3",
  "luma_ray2",
  "kling_v21",
  "pika_v22",
  "minimax_hailuo02",
  "bytedance_seedance",
  "alibaba_wan25",
  "replicate",
  "fal",
];

export const StudioJobPage: React.FC<{ jobId: string }> = ({ jobId }) => {
  const qc = useQueryClient();
  const job = useQuery({
    queryKey: ["studio-job", jobId],
    queryFn: () => api<Job>(`/admin/studio/jobs/${jobId}`),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status && ["completed", "failed", "cancelled"].includes(status) ? false : 4000;
    },
  });

  const [draft, setDraft] = useState<Job | null>(null);
  useEffect(() => {
    if (job.data) setDraft(job.data);
  }, [job.data]);

  const save = useMutation({
    mutationFn: () =>
      api(`/admin/studio/jobs/${jobId}/scenes`, {
        method: "PATCH",
        body: JSON.stringify({
          scenes: draft?.scenes,
          title: draft?.title,
          subtitle: draft?.subtitle,
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio-job", jobId] }),
  });
  const approve = useMutation({
    mutationFn: () => api(`/admin/studio/jobs/${jobId}/approve`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio-job", jobId] }),
  });
  const cancel = useMutation({
    mutationFn: () => api(`/admin/studio/jobs/${jobId}/cancel`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["studio-job", jobId] }),
  });

  if (!draft) return <div>Loading…</div>;

  return (
    <div className="space-y-6">
      <a href="#studio" className="text-sm text-slate-500 inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> back to Studio
      </a>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display text-3xl font-extrabold">{draft.title ?? draft.brief}</h1>
          <div className="text-sm text-slate-500">
            {draft.template} • {draft.durationSec}s • cost ${draft.costUSD.toFixed(3)}
          </div>
        </div>
        <Status status={draft.status} />
      </div>

      {draft.error ? (
        <div className="card border-red-200 bg-red-50 text-red-700 text-sm">{draft.error}</div>
      ) : null}

      {draft.mp4Url ? (
        <video src={draft.mp4Url} controls className="rounded-2xl w-full max-w-2xl shadow-lg" />
      ) : null}

      <div className="card space-y-3">
        <h2 className="font-semibold">Title & subtitle</h2>
        <input
          className="input w-full"
          value={draft.title ?? ""}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          disabled={draft.status !== "awaiting_approval"}
        />
        <input
          className="input w-full"
          value={draft.subtitle ?? ""}
          onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
          disabled={draft.status !== "awaiting_approval"}
        />
      </div>

      <div className="space-y-4">
        {draft.scenes.map((s, i) => (
          <div key={i} className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Scene {i + 1}</div>
              <div className="text-xs text-slate-500">{s.durationSec.toFixed(1)}s</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {s.imageUrl ? (
                  <img src={s.imageUrl} className="rounded-xl w-full" />
                ) : (
                  <div className="aspect-video bg-slate-100 rounded-xl grid place-items-center text-slate-400 text-sm">
                    image will appear here
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500">Voiceover</label>
                <textarea
                  className="input w-full h-20"
                  value={s.voiceoverText}
                  onChange={(e) =>
                    updateScene(draft, setDraft, i, { voiceoverText: e.target.value })
                  }
                  disabled={draft.status !== "awaiting_approval"}
                />
                <label className="text-xs text-slate-500">Image prompt</label>
                <textarea
                  className="input w-full h-20"
                  value={s.imagePrompt}
                  onChange={(e) =>
                    updateScene(draft, setDraft, i, { imagePrompt: e.target.value })
                  }
                  disabled={draft.status !== "awaiting_approval"}
                />
                <div className="flex gap-2 flex-wrap">
                  <Sel
                    label="image provider"
                    value={s.imageProvider ?? ""}
                    onChange={(v) => updateScene(draft, setDraft, i, { imageProvider: v || undefined })}
                    options={["", ...IMAGE_PROVIDERS]}
                    disabled={draft.status !== "awaiting_approval"}
                  />
                  {s.useVideoClip ? (
                    <Sel
                      label="video provider"
                      value={s.videoProvider ?? ""}
                      onChange={(v) => updateScene(draft, setDraft, i, { videoProvider: v || undefined })}
                      options={["", ...VIDEO_PROVIDERS]}
                      disabled={draft.status !== "awaiting_approval"}
                    />
                  ) : null}
                  <label className="text-xs text-slate-600 flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={!!s.useVideoClip}
                      onChange={(e) => updateScene(draft, setDraft, i, { useVideoClip: e.target.checked })}
                      disabled={draft.status !== "awaiting_approval"}
                    />
                    use video clip
                  </label>
                  <label className="text-xs text-slate-600 flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={!!s.textInImage}
                      onChange={(e) => updateScene(draft, setDraft, i, { textInImage: e.target.checked })}
                      disabled={draft.status !== "awaiting_approval"}
                    />
                    text-in-image
                  </label>
                  <label className="text-xs text-slate-600 flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={s.brandConsistency === "high"}
                      onChange={(e) =>
                        updateScene(draft, setDraft, i, {
                          brandConsistency: e.target.checked ? "high" : undefined,
                        })
                      }
                      disabled={draft.status !== "awaiting_approval"}
                    />
                    brand-character
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 sticky bottom-2 bg-slate-50/90 backdrop-blur p-3 rounded-2xl border border-slate-200">
        <button
          className="btn-ghost"
          onClick={() => qc.invalidateQueries({ queryKey: ["studio-job", jobId] })}
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
        {draft.status === "awaiting_approval" ? (
          <>
            <button className="btn-ghost" onClick={() => save.mutate()}>
              Save draft
            </button>
            <button className="btn-primary" onClick={() => approve.mutate()}>
              <CheckCircle className="w-4 h-4" /> Approve & render
            </button>
          </>
        ) : draft.status === "rendering" || draft.status === "generating_assets" ? (
          <span className="inline-flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin" /> {draft.status.replace("_", " ")}…
          </span>
        ) : null}
        {!["completed", "cancelled", "failed"].includes(draft.status) ? (
          <button className="btn-ghost text-red-600" onClick={() => cancel.mutate()}>
            <XCircle className="w-4 h-4" /> Cancel
          </button>
        ) : null}
        {draft.mp4Url ? (
          <a
            className="btn-primary ml-auto"
            href={draft.mp4Url}
            target="_blank"
            rel="noreferrer"
            download
          >
            Download MP4
          </a>
        ) : null}
        {draft.mp4Url && draft.status === "completed" ? (
          <PostizPublishButton job={draft} />
        ) : null}
      </div>
    </div>
  );
};

function updateScene(
  draft: Job,
  setDraft: (j: Job) => void,
  i: number,
  patch: Partial<Scene>,
) {
  const next = { ...draft, scenes: draft.scenes.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) };
  setDraft(next);
}

const Sel: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}> = ({ label, value, onChange, options, disabled }) => (
  <label className="text-xs text-slate-600">
    {label}{" "}
    <select
      className="input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o || "(auto-route)"}
        </option>
      ))}
    </select>
  </label>
);

const PROVIDER_CHANNEL_HINTS: Array<{ provider: string; label: string }> = [
  { provider: "instagram", label: "Instagram Reel" },
  { provider: "tiktok", label: "TikTok" },
  { provider: "youtube", label: "YouTube Short" },
  { provider: "x", label: "X (Twitter)" },
  { provider: "linkedin", label: "LinkedIn" },
  { provider: "bluesky", label: "Bluesky" },
  { provider: "threads", label: "Threads" },
  { provider: "mastodon", label: "Mastodon" },
];

const PostizPublishButton: React.FC<{ job: Job }> = ({ job }) => {
  const [open, setOpen] = useState(false);
  const channels = useQuery({
    queryKey: ["postiz-channels"],
    queryFn: () => api<{ channels: Array<{ id: string; providerIdentifier?: string; name?: string }> }>(
      "/admin/postiz/summary",
    ).catch(() => ({ channels: [] as Array<{ id: string; providerIdentifier?: string; name?: string }> })),
    enabled: open,
  });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [content, setContent] = useState(
    job.title ? `${job.title}${job.subtitle ? `\n\n${job.subtitle}` : ""}` : job.brief,
  );
  const publish = useMutation({
    mutationFn: async () => {
      const ids = Object.keys(selected).filter((id) => selected[id]);
      if (!ids.length) throw new Error("pick at least one channel");
      const channelObjs = (channels.data?.channels ?? []).filter((c) => ids.includes(c.id));
      const posts = channelObjs.map((c) => ({
        integration: { id: c.id },
        value: [{ content, image: job.mp4Url ? [{ id: "video", path: job.mp4Url }] : [] }],
        settings: { __type: c.providerIdentifier ?? "x" },
      }));
      return api("/admin/postiz/proxy/posts", {
        method: "POST",
        body: JSON.stringify({
          type: "now",
          date: new Date().toISOString(),
          shortLink: false,
          tags: [],
          posts,
        }),
      });
    },
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      <button className="btn-ghost" onClick={() => setOpen(true)} title="Publish via Postiz">
        <Megaphone className="w-4 h-4" /> Publish
      </button>
      {open ? (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-10" onClick={() => setOpen(false)}>
          <div className="card w-[560px] max-w-[92vw] space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-extrabold flex items-center gap-2">
              <Megaphone className="text-primary" /> Publish via Postiz
            </h3>
            <p className="text-xs text-slate-500">
              Posts immediately to selected channels. Video URL is sent as a media attachment;
              Postiz will fetch it.
            </p>
            <textarea
              className="input w-full h-24"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="space-y-1.5 max-h-56 overflow-auto">
              {channels.isLoading ? (
                <div className="text-sm text-slate-500 inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading channels…
                </div>
              ) : (channels.data?.channels ?? []).length === 0 ? (
                <div className="text-sm text-slate-500">
                  No connected channels. Connect them in the Social publishing tab.
                </div>
              ) : (
                channels.data!.channels.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!selected[c.id]}
                      onChange={(e) => setSelected({ ...selected, [c.id]: e.target.checked })}
                    />
                    <span className="font-medium">{c.name ?? c.providerIdentifier ?? c.id}</span>
                    <span className="text-xs text-slate-400">{c.providerIdentifier}</span>
                  </label>
                ))
              )}
            </div>
            {publish.isError ? (
              <div className="text-xs text-red-600">{(publish.error as Error).message}</div>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                disabled={publish.isPending}
                onClick={() => publish.mutate()}
              >
                {publish.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Publishing…
                  </>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4" /> Publish now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

void PROVIDER_CHANNEL_HINTS;

const Status: React.FC<{ status: string }> = ({ status }) => {
  const cls =
    status === "completed"
      ? "bg-green-100 text-green-700"
      : status === "failed"
      ? "bg-red-100 text-red-700"
      : status === "awaiting_approval"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";
  return <span className={`pill ${cls}`}>{status}</span>;
};

import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  type CoachMemory,
  type CoachMemoryTopic,
  deleteCoachMemory,
  listCoachMemory,
  logCoachMemory,
} from "../../lib/coach/coachMemory";
import { hasFeatureConsent } from "../../lib/localAi";

const TOPIC_OPTIONS: { id: CoachMemoryTopic; label: string; emoji: string }[] = [
  { id: "sleep", label: "Sleep", emoji: "😴" },
  { id: "meltdown", label: "Meltdown", emoji: "😡" },
  { id: "rupture-repair", label: "Rupture / repair", emoji: "💞" },
  { id: "milestone", label: "Milestone", emoji: "🎯" },
  { id: "language", label: "Language", emoji: "🗣️" },
  { id: "social", label: "Social", emoji: "🤝" },
  { id: "sibling", label: "Sibling", emoji: "👫" },
  { id: "school", label: "School", emoji: "🎒" },
  { id: "health", label: "Health", emoji: "🩺" },
  { id: "emotion", label: "Emotion", emoji: "❤️" },
  { id: "curiosity", label: "Curiosity", emoji: "❓" },
  { id: "other", label: "Other", emoji: "📝" },
];

export const CoachMemoryScreen: React.FC = () => {
  const { activeChild, children } = useApp();
  const [selectedChildId, setSelectedChildId] = useState<string | undefined>(activeChild?.id);
  useEffect(() => { setSelectedChildId(activeChild?.id ?? children[0]?.id); }, [activeChild?.id, children]);
  const child = children.find((c) => c.id === selectedChildId);

  const [items, setItems] = useState<CoachMemory[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftTopic, setDraftTopic] = useState<CoachMemoryTopic>("other");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!child) return;
    setLoading(true);
    try {
      setItems(await listCoachMemory(child.id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [child?.id]);

  async function add() {
    if (!child || !draft.trim()) return;
    if (!hasFeatureConsent(child.id, "coach")) {
      window.alert("Enable Coach AI consent in Profile → AI privacy & consent first.");
      return;
    }
    setBusy(true);
    try {
      const r = await logCoachMemory({ childId: child.id, observation: draft.trim(), topic: draftTopic, weight: 1 });
      if (!r) {
        window.alert("Couldn't save observation. Check connection.");
      } else {
        setDraft("");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Permanently delete this observation? It will stop influencing the coach immediately.")) return;
    const ok = await deleteCoachMemory(id);
    if (ok) await refresh();
    else window.alert("Couldn't delete. Try again.");
  }

  const grouped: Record<CoachMemoryTopic, CoachMemory[]> = {} as Record<CoachMemoryTopic, CoachMemory[]>;
  for (const it of items ?? []) {
    (grouped[it.topic] ??= [] as CoachMemory[]).push(it);
  }
  const orderedTopics = TOPIC_OPTIONS.filter((t) => (grouped[t.id]?.length ?? 0) > 0);

  if (!child) {
    return <div className="p-5 text-sm text-gray-600">Add a child profile to use long memory.</div>;
  }

  return (
    <div className="overflow-y-auto h-full pb-12">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">Coach long memory</h1>
        <p className="text-xs text-gray-600 mt-1">
          The coach quotes back specifics from these observations across sessions ("you mentioned 3 weeks ago that…"). Stored for 180 days, encrypted at rest, deletable any time. We strip emails, phone numbers, and SSN-shaped strings before saving.
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
          <div className="text-xs font-semibold text-gray-700 mb-2">Add an observation</div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 800))}
            rows={3}
            placeholder={`Anything you'd want the coach to remember about ${child.name}. e.g. "loves dinosaurs but freezes on stage", "sleeps better when we read together for 10 min".`}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm leading-relaxed"
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {TOPIC_OPTIONS.map((t) => {
              const active = t.id === draftTopic;
              return (
                <button
                  key={t.id}
                  onClick={() => setDraftTopic(t.id)}
                  className={`px-2.5 py-1 rounded-full text-xs ${active ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-700"}`}
                >{t.emoji} {t.label}</button>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-400">{draft.length}/800 chars</span>
            <button
              onClick={add}
              disabled={busy || !draft.trim()}
              className="rounded-xl bg-indigo-500 text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
            >{busy ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </section>

      <section className="px-5 pb-6">
        <div className="text-xs font-semibold text-gray-700 mb-2">
          {loading ? "Loading…" : `${items?.length ?? 0} observation${(items?.length ?? 0) === 1 ? "" : "s"}`}
        </div>
        {(items?.length ?? 0) === 0 && !loading && (
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-3 text-xs text-gray-600">
            Nothing yet. Add an observation above, or have a chat with the coach — observation-shaped messages are auto-saved.
          </div>
        )}
        {orderedTopics.map((t) => (
          <div key={t.id} className="mt-3">
            <div className="text-xs font-semibold text-gray-700 mb-1">{t.emoji} {t.label} ({grouped[t.id]?.length})</div>
            <div className="space-y-2">
              {grouped[t.id]?.map((m) => (
                <div key={m.id} className="rounded-2xl bg-white border border-gray-200 p-3">
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{m.observation}</div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>{new Date(m.created_at).toLocaleDateString()} · weight {m.weight.toFixed(1)}</span>
                    <button onClick={() => remove(m.id)} className="text-red-600 hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

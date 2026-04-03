import React, { useState } from "react";
import type { CoachChatMessage } from "@/lib/coach/coachEngine";

type Props = {
  messages: CoachChatMessage[];
  isPremium: boolean;
  loading: boolean;
  onSend: (message: string) => Promise<void> | void;
};

export function CoachChat({ messages, isPremium, loading, onSend }: Props) {
  const [draft, setDraft] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = draft.trim();
    if (!next || loading) return;
    setDraft("");
    await onSend(next);
  }

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-sm font-semibold text-slate-900">Coach chat</div>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Premium enables follow-up coaching like “How do I improve speech?” or “Give focus activities for this week.”
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-sm font-semibold text-slate-900">Coach chat</div>
      <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="rounded-2xl bg-white p-3 text-xs text-slate-500">
            Ask about focus, speech, emotions, routines, or activity ideas.
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                message.role === "user"
                  ? "ml-6 bg-slate-900 text-white"
                  : "mr-6 bg-white text-slate-600"
              }`}
            >
              {message.content}
            </div>
          ))
        )}
        {loading && (
          <div className="mr-6 rounded-2xl bg-white px-3 py-2 text-xs text-slate-400">
            Coach is thinking...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask the coach a follow-up"
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || loading}
          className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// VoiceSettingsCard
// ----------------------------------------------------------------------------
// Profile-screen card that exposes:
//   • Voice agent (coach / counselor / narrator)
//   • Locale / speech language
//   • Transcript retention toggle
//   • Quiet hours (no voice between 22:00 and 07:00)
//   • Mini "test voice" button
//
// Preferences persist in localStorage; the conversational layer reads them
// on session start. We keep this client-side until the cloud sync feature
// in §0.4 ships.
// ============================================================================

import React, { useEffect, useState } from "react";
import { captureProductEvent } from "../../utils/productAnalytics";
import { pickAdapter } from "../../lib/voice/nativeVoiceAdapter";
import type { VoiceAgent } from "../../lib/voice/voiceAdapter";

const LS_KEY = "neurospark_voice_prefs_v1";

export interface VoicePrefs {
  agent: VoiceAgent;
  locale: string;
  retainTranscripts: boolean;
  quietHours: boolean;
}

const DEFAULTS: VoicePrefs = {
  agent: "coach",
  locale: "en",
  retainTranscripts: false,
  quietHours: true,
};

const AGENT_OPTIONS: { id: VoiceAgent; emoji: string; label: string; desc: string }[] = [
  { id: "coach",     emoji: "🧑‍🏫", label: "Coach",     desc: "Practical, step-by-step guidance" },
  { id: "counselor", emoji: "💬",   label: "Counselor", desc: "Empathic, parent reflection space" },
  { id: "narrator",  emoji: "📖",   label: "Narrator",  desc: "Hands-free activity narration" },
];

const LOCALE_OPTIONS = [
  { id: "en",    label: "English (en-US)" },
  { id: "hi",    label: "Hindi (hi-IN)" },
  { id: "es",    label: "Spanish (es-ES)" },
  { id: "fr",    label: "French (fr-FR)" },
  { id: "ar",    label: "Arabic (ar-SA)" },
  { id: "pt",    label: "Portuguese (pt-BR)" },
];

export function loadVoicePrefs(): VoicePrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<VoicePrefs>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveVoicePrefs(prefs: VoicePrefs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode */
  }
}

export function VoiceSettingsCard() {
  const [prefs, setPrefs] = useState<VoicePrefs>(() => loadVoicePrefs());
  const [testStatus, setTestStatus] = useState<"idle" | "playing" | "unavailable">("idle");

  useEffect(() => {
    saveVoicePrefs(prefs);
  }, [prefs]);

  const update = (patch: Partial<VoicePrefs>) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      const changedKey = Object.keys(patch)[0] ?? "unknown";
      captureProductEvent("voice_settings_change", {
        voice_agent: next.agent,
        voice_locale: next.locale,
        surface: changedKey,
      });
      return next;
    });
  };

  const handleTest = async () => {
    const adapter = pickAdapter();
    if (!adapter.capabilities().tts) {
      setTestStatus("unavailable");
      return;
    }
    setTestStatus("playing");
    await adapter.speak({
      text:
        prefs.agent === "coach"
          ? "Hi! I'm your coach. Tell me about today's activity and I'll help."
          : prefs.agent === "counselor"
          ? "I'm here to listen. How are you feeling about parenting today?"
          : "Now let's start the activity together. Take a deep breath.",
      locale: prefs.locale,
      onEnd: () => setTestStatus("idle"),
      onError: () => setTestStatus("unavailable"),
    });
  };

  return (
    <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm space-y-4">
      <div>
        <div className="text-slate-800 font-bold text-xs mb-2">🎙 Voice agent</div>
        <div className="grid grid-cols-3 gap-1.5">
          {AGENT_OPTIONS.map((a) => {
            const active = prefs.agent === a.id;
            return (
              <button
                key={a.id}
                onClick={() => update({ agent: a.id })}
                className="flex flex-col items-center p-2 rounded-xl text-center transition"
                style={{
                  background: active ? "rgba(67,97,238,0.10)" : "#F8FAFC",
                  border: `1px solid ${active ? "#4361EE" : "#E2E8F0"}`,
                }}
                aria-pressed={active}
              >
                <span className="text-lg">{a.emoji}</span>
                <span className="text-[11px] font-bold text-slate-700">{a.label}</span>
                <span className="text-[9px] text-slate-400 leading-tight mt-0.5">{a.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-slate-800 font-bold text-xs mb-2">🌐 Speech language</div>
        <select
          value={prefs.locale}
          onChange={(e) => update({ locale: e.target.value })}
          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700"
        >
          {LOCALE_OPTIONS.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
      </div>

      <ToggleRow
        label="Retain conversation transcripts"
        hint="Off by default. When off, only the next-step suggestion is remembered."
        value={prefs.retainTranscripts}
        onChange={(v) => update({ retainTranscripts: v })}
      />
      <ToggleRow
        label="Quiet hours (22:00 – 07:00)"
        hint="Voice features pause during these hours so they don't disrupt sleep."
        value={prefs.quietHours}
        onChange={(v) => update({ quietHours: v })}
      />

      <button
        onClick={handleTest}
        disabled={testStatus === "playing"}
        className="w-full py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
      >
        {testStatus === "playing"
          ? "Speaking…"
          : testStatus === "unavailable"
          ? "Voice unavailable on this device"
          : "▶ Test voice"}
      </button>
    </div>
  );
}

function ToggleRow({
  label, hint, value, onChange,
}: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between gap-3 text-left"
      role="switch"
      aria-checked={value}
    >
      <div className="min-w-0 flex-1">
        <div className="text-slate-800 text-xs font-bold">{label}</div>
        <div className="text-slate-400 text-[11px] leading-tight">{hint}</div>
      </div>
      <div
        className="relative w-9 h-5 rounded-full flex-shrink-0 transition"
        style={{ background: value ? "#4361EE" : "#CBD5E1" }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
          style={{ left: value ? 18 : 2 }}
        />
      </div>
    </button>
  );
}

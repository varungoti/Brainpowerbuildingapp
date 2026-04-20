import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  AUDIO_MICRO_RITUALS,
  type MicroRitual,
  type RitualMoment,
  ritualsForAge,
  ritualsForMoment,
} from "../../lib/audio/microRituals";

const MOMENTS: { id: RitualMoment; label: string; emoji: string }[] = [
  { id: "car-ride", label: "Car ride", emoji: "🚗" },
  { id: "walk", label: "Walk", emoji: "🚶" },
  { id: "toothbrush", label: "Toothbrush", emoji: "🪥" },
  { id: "dinner", label: "Dinner", emoji: "🍽️" },
  { id: "bath", label: "Bath", emoji: "🛁" },
  { id: "bedtime", label: "Bedtime", emoji: "🌙" },
  { id: "wakeup", label: "Wake up", emoji: "🌅" },
  { id: "errand", label: "Errand", emoji: "🛒" },
  { id: "anytime", label: "Anytime", emoji: "✨" },
];

function ageMonthsFromDob(dob: string): number {
  const b = new Date(dob);
  const now = new Date();
  return (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
}

/** Splits a ritual script on the explicit `\n\n` pause beats. Each beat plays
 * back, then we wait 5 s for the parent + child to interact, then move on. */
function scriptSegments(script: string): string[] {
  return script.split("\n\n").map((s) => s.trim()).filter(Boolean);
}

export const AudioModeScreen: React.FC = () => {
  const { activeChild, logActivity, navigate } = useApp();
  const ageMonths = activeChild ? ageMonthsFromDob(activeChild.dob) : 60;
  const [moment, setMoment] = useState<RitualMoment>("anytime");
  const [active, setActive] = useState<MicroRitual | null>(null);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const candidates = useMemo(() => {
    const byMoment = ritualsForMoment(moment);
    const byAge = ritualsForAge(ageMonths);
    return byMoment.filter((r) => byAge.includes(r));
  }, [moment, ageMonths]);

  const segments = useMemo(() => (active ? scriptSegments(active.script) : []), [active]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function bindMediaSession(r: MicroRitual) {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = (navigator as Navigator & { mediaSession?: MediaSession }).mediaSession;
    if (!ms) return;
    try {
      // Lock-screen / car-play metadata so the parent can control without
      // looking at the device.
      ms.metadata = new (window as Window & { MediaMetadata: typeof MediaMetadata }).MediaMetadata({
        title: r.title,
        artist: "NeuroSpark Audio",
        album: r.region,
        artwork: [],
      });
      ms.setActionHandler("play", () => resume());
      ms.setActionHandler("pause", () => pause());
      ms.setActionHandler("nexttrack", () => skip());
      ms.setActionHandler("previoustrack", () => speakSegment(r, segmentIndexRef.current));
      ms.setActionHandler("stop", () => stop());
      ms.playbackState = "playing";
    } catch (e) {
      console.warn("mediaSession bind failed", e);
    }
  }

  const segmentIndexRef = useRef(0);
  useEffect(() => { segmentIndexRef.current = segmentIndex; }, [segmentIndex]);

  function unbindMediaSession() {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = (navigator as Navigator & { mediaSession?: MediaSession }).mediaSession;
    if (!ms) return;
    try {
      for (const a of ["play", "pause", "nexttrack", "previoustrack", "stop"] as const) {
        ms.setActionHandler(a, null);
      }
      ms.playbackState = "none";
    } catch {/* noop */}
  }

  function skip() {
    if (!active) return;
    const segs = scriptSegments(active.script);
    const next = segmentIndexRef.current + 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (next >= segs.length) {
      finishRitual(active);
      return;
    }
    setSegmentIndex(next);
    speakSegment(active, next);
  }

  async function share() {
    if (!active) return;
    const text = `Try "${active.title}" with your kid — a ${active.durationSec}s screen-free brain ritual from NeuroSpark.`;
    const url = "https://neurospark.com/audio";
    try {
      const nav = (typeof navigator !== "undefined" ? navigator : null) as null | (Navigator & {
        share?: (d: { title: string; text: string; url: string }) => Promise<void>;
        clipboard?: { writeText: (s: string) => Promise<void> };
      });
      if (nav?.share) {
        await nav.share({ title: active.title, text, url });
      } else if (nav?.clipboard) {
        await nav.clipboard.writeText(`${text} ${url}`);
        window.alert("Copied to clipboard.");
      }
    } catch {/* user cancelled */}
  }

  function startRitual(r: MicroRitual) {
    setActive(r);
    setSegmentIndex(0);
    setRunning(true);
    speakSegment(r, 0);
    bindMediaSession(r);
  }

  function speakSegment(r: MicroRitual, idx: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const segs = scriptSegments(r.script);
    const text = segs[idx];
    if (!text) {
      finishRitual(r);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1.05;
    u.lang = "en-US";
    u.onend = () => {
      const nextIdx = idx + 1;
      if (nextIdx >= segs.length) {
        finishRitual(r);
        return;
      }
      window.setTimeout(() => {
        setSegmentIndex(nextIdx);
        speakSegment(r, nextIdx);
      }, 5000);
    };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  }

  function pause() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
    setRunning(false);
  }

  function resume() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
    setRunning(true);
  }

  function stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setRunning(false);
    setActive(null);
    setSegmentIndex(0);
    unbindMediaSession();
  }

  function finishRitual(r: MicroRitual) {
    logActivity({
      childId: activeChild?.id ?? "unknown",
      activityId: `audio:${r.id}`,
      activityName: r.title,
      emoji: r.emoji,
      intelligences: r.intelligences,
      method: "audio-ritual",
      region: r.region,
      regionEmoji: r.regionEmoji,
      duration: Math.round(r.durationSec / 60),
      completed: true,
      engagementRating: 4,
      parentNotes: "Completed via NeuroSpark Audio mode",
    });
    setRunning(false);
  }

  if (active) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-indigo-50 to-white">
        <header className="px-5 pt-4 pb-3 flex items-center justify-between">
          <button
            className="text-sm text-gray-700"
            onClick={stop}
          >‹ Back</button>
          <div className="text-xs text-gray-500">{moment}</div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-7xl mb-4">{active.emoji}</div>
          <h2 className="text-2xl font-bold text-gray-900">{active.title}</h2>
          <div className="text-sm text-gray-600 mt-1">
            {active.region} · {Math.round(active.durationSec)}s · step {segmentIndex + 1} / {segments.length}
          </div>

          <p className="mt-8 text-lg text-gray-800 leading-relaxed max-w-md">
            {segments[segmentIndex] ?? "…"}
          </p>
        </div>

        <div className="px-5 pb-4 grid grid-cols-4 gap-2">
          <button
            onClick={stop}
            className="rounded-3xl bg-gray-200 py-4 text-sm font-bold text-gray-900"
          >Stop</button>
          {running ? (
            <button
              onClick={pause}
              className="rounded-3xl bg-amber-400 py-4 text-sm font-bold text-gray-900"
            >Pause</button>
          ) : (
            <button
              onClick={resume}
              className="rounded-3xl bg-emerald-500 py-4 text-sm font-bold text-white"
            >Resume</button>
          )}
          <button
            onClick={() => speakSegment(active, segmentIndex)}
            className="rounded-3xl bg-indigo-500 py-4 text-sm font-bold text-white"
          >Repeat</button>
          <button
            onClick={skip}
            className="rounded-3xl bg-violet-500 py-4 text-sm font-bold text-white"
          >Skip ›</button>
        </div>
        <div className="px-5 pb-8">
          <button
            onClick={share}
            className="w-full rounded-2xl bg-white border border-gray-200 py-3 text-sm font-semibold text-gray-700"
          >Share with co-parent / caregiver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full pb-12">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Audio mode</h1>
          <button
            className="text-xs text-gray-500"
            onClick={() => navigate("home")}
          >On-screen mode ›</button>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Screen-free 90–120 second activities for the car, the walk, the dinner table, brushing teeth. Same brain-region credit as on-screen play.
        </p>
      </div>

      <section className="px-5 mb-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">When are you?</div>
        <div className="grid grid-cols-3 gap-2">
          {MOMENTS.map((m) => {
            const active = m.id === moment;
            return (
              <button
                key={m.id}
                onClick={() => setMoment(m.id)}
                className={`flex flex-col items-center gap-1 px-3 py-3 rounded-2xl border ${active ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"}`}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-xs text-gray-700">{m.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-5 mb-3">
        <div className="text-xs font-semibold text-gray-700 mb-2">
          {candidates.length} ritual{candidates.length === 1 ? "" : "s"} for {activeChild?.name ?? "this child"} right now
        </div>
        <div className="space-y-2">
          {candidates.length === 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Nothing in catalog matches this moment for this age. Switch moment, or pick from the full library below.
            </div>
          )}
          {candidates.map((r) => (
            <button
              key={r.id}
              onClick={() => startRitual(r)}
              className="w-full text-left p-4 rounded-2xl bg-white border border-gray-200 flex gap-3 items-center hover:border-indigo-300"
            >
              <div className="text-3xl">{r.emoji}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{r.title}</div>
                <div className="text-xs text-gray-600 mt-0.5">{r.description}</div>
                <div className="text-xs text-gray-400 mt-1">{r.region} · {r.durationSec}s</div>
              </div>
              <div className="text-2xl text-indigo-500">▶</div>
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 mb-5">
        <details className="rounded-2xl bg-white border border-gray-200 p-3">
          <summary className="text-xs font-semibold text-gray-700 cursor-pointer">All {AUDIO_MICRO_RITUALS.length} rituals</summary>
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            {AUDIO_MICRO_RITUALS.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <span>{r.emoji}</span>
                <span className="font-medium text-gray-800">{r.title}</span>
                <span>·</span>
                <span>{r.region}</span>
              </div>
            ))}
          </div>
        </details>
      </section>
    </div>
  );
};

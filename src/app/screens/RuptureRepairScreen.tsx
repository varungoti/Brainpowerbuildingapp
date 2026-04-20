import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { type RuptureScript, startRuptureRepair, logCoachMemory } from "../../lib/coach/coachMemory";

function ageMonths(dob: string): number {
  const b = new Date(dob);
  const n = new Date();
  return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
}

const TRIGGERS = [
  { id: "tantrum", label: "Tantrum / yelling" },
  { id: "transition", label: "Transition refusal" },
  { id: "sibling", label: "Sibling conflict" },
  { id: "screen-time", label: "Screen-time fight" },
  { id: "bedtime", label: "Bedtime resistance" },
  { id: "other", label: "Something else" },
];

export const RuptureRepairScreen: React.FC = () => {
  const { activeChild, navigate } = useApp();
  const [phase, setPhase] = useState<"choose" | "running" | "after">("choose");
  const [trigger, setTrigger] = useState<string>("tantrum");
  const [script, setScript] = useState<RuptureScript | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function start() {
    if (!activeChild) return;
    setLoading(true);
    try {
      const s = await startRuptureRepair({
        childId: activeChild.id,
        childAgeMonths: ageMonths(activeChild.dob),
        childName: activeChild.name,
        trigger,
      });
      if (!s) {
        window.alert("Couldn't load the script. Try again with connection.");
        return;
      }
      setScript(s);
      setStepIdx(0);
      setPhase("running");
      speakStep(s.script, 0);
    } finally {
      setLoading(false);
    }
  }

  function speakStep(steps: string[], idx: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const text = steps[idx];
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.pitch = 0.95;
    u.lang = "en-US";
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  }

  function next() {
    if (!script) return;
    const nextIdx = stepIdx + 1;
    if (nextIdx >= script.script.length) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setPhase("after");
      return;
    }
    setStepIdx(nextIdx);
    speakStep(script.script, nextIdx);
  }

  async function logRepair(rating: "calmer" | "no-change" | "worse") {
    if (!activeChild) return;
    await logCoachMemory({
      childId: activeChild.id,
      observation: `Rupture-repair after a ${trigger} moment. Outcome: ${rating}.`,
      topic: "rupture-repair",
      weight: rating === "calmer" ? 1.5 : 1.0,
    });
    navigate("home");
  }

  if (phase === "running" && script) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-rose-50 to-white">
        <header className="px-5 pt-4 pb-2">
          <button onClick={() => setPhase("choose")} className="text-sm text-gray-600">‹ Cancel</button>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-4">🌬️</div>
          <div className="text-xs uppercase tracking-wider text-rose-600 font-bold">Rupture & Repair · step {stepIdx + 1} / {script.script.length}</div>
          <p className="mt-6 text-xl text-gray-900 leading-relaxed font-medium max-w-md">
            {script.script[stepIdx]}
          </p>
        </div>
        <div className="px-5 pb-8 grid grid-cols-2 gap-3">
          <button
            onClick={() => speakStep(script.script, stepIdx)}
            className="rounded-3xl bg-gray-200 py-5 text-base font-semibold text-gray-900"
          >Repeat</button>
          <button
            onClick={next}
            className="rounded-3xl bg-rose-500 py-5 text-base font-bold text-white"
          >{stepIdx + 1 >= script.script.length ? "Done" : "Next"}</button>
        </div>
      </div>
    );
  }

  if (phase === "after" && script) {
    return (
      <div className="overflow-y-auto h-full pb-12">
        <div className="px-5 pt-4 pb-3">
          <h1 className="text-2xl font-bold text-gray-900">After the storm</h1>
          <p className="text-xs text-gray-600 mt-1">{script.disclaimer}</p>
        </div>
        <section className="px-5 mb-5">
          <div className="text-xs font-semibold text-gray-700 mb-2">Once they're calmer, try one of these:</div>
          <div className="space-y-2">
            {script.followUpAfterCalm.map((line, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-200 p-3 text-sm text-gray-800">
                {line}
              </div>
            ))}
          </div>
        </section>
        <section className="px-5 mb-5">
          <div className="text-xs font-semibold text-gray-700 mb-2">How did this go?</div>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => logRepair("calmer")} className="rounded-2xl bg-emerald-500 text-white py-3 text-sm font-semibold">Calmer</button>
            <button onClick={() => logRepair("no-change")} className="rounded-2xl bg-gray-300 text-gray-900 py-3 text-sm font-semibold">No change</button>
            <button onClick={() => logRepair("worse")} className="rounded-2xl bg-rose-200 text-rose-900 py-3 text-sm font-semibold">Worse</button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Logged to long memory so the coach learns your child's patterns.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full pb-12">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">Rupture & Repair</h1>
        <p className="text-xs text-gray-600 mt-1">
          Curated 90-second voice script for the next 90 seconds — dyadic breathing, parent script, recovery reframe. Always free.
        </p>
      </div>
      <section className="px-5 mb-4">
        <div className="text-xs font-semibold text-gray-700 mb-2">What just happened?</div>
        <div className="grid grid-cols-2 gap-2">
          {TRIGGERS.map((t) => {
            const active = t.id === trigger;
            return (
              <button
                key={t.id}
                onClick={() => setTrigger(t.id)}
                className={`px-3 py-3 rounded-2xl text-sm text-left ${active ? "bg-rose-100 border-2 border-rose-400" : "bg-white border border-gray-200"}`}
              >{t.label}</button>
            );
          })}
        </div>
      </section>
      <section className="px-5">
        <button
          onClick={start}
          disabled={loading || !activeChild}
          className="w-full rounded-3xl bg-rose-500 py-5 text-base font-bold text-white disabled:opacity-50"
        >{loading ? "Preparing…" : "Start the 90-second script"}</button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          You can do this with your child in your arms. The script speaks the words for you.
        </p>
      </section>
    </div>
  );
};

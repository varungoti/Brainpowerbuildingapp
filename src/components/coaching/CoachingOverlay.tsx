import React, { useState, useEffect, useRef } from "react";
import type { CoachingGuidance } from "../../lib/coaching/parentCoachingEngine";

interface Props {
  guidance: CoachingGuidance;
  onClose: () => void;
}

export function CoachingOverlay({ guidance, onClose }: Props) {
  const [timerSeconds, setTimerSeconds] = useState(guidance.timerSuggestionMinutes * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const min = Math.floor(timerSeconds / 60);
  const sec = timerSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl p-5 pb-8 max-h-[75vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Parent Coaching</h3>
          <button onClick={onClose} className="text-gray-400 text-sm">Close</button>
        </div>

        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50">
            <span className="font-mono text-lg font-bold text-purple-700">
              {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
            </span>
            <button
              onClick={() => setRunning(!running)}
              className="px-3 py-1 rounded-full text-[10px] font-medium text-white"
              style={{ background: running ? "#EF4444" : "#4361EE" }}
            >
              {running ? "Pause" : "Start"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Section title="Key Interactions" emoji="🗝️" items={guidance.keyInteractions} />
          <Section title="Deepening Tips" emoji="🔍" items={guidance.deepeningTips} />
          <Section title="Observe For" emoji="👁️" items={guidance.observeFor} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, emoji, items }: { title: string; emoji: string; items: string[] }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <h4 className="text-xs font-bold text-gray-700 mb-2">{emoji} {title}</h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-[11px] text-gray-600 flex gap-2">
            <span className="text-gray-300 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

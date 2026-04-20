import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { DailySchedule } from "../../components/routine/DailySchedule";
import { computeActivityWindows, DEFAULT_ROUTINE, type RoutineConfig } from "../../lib/routine/routineOptimizer";

export function RoutineScreen() {
  const { activeChild, goBack, routineConfig, saveRoutineConfig } = useApp();
  const [config, setConfig] = useState<RoutineConfig>(routineConfig ?? DEFAULT_ROUTINE);
  const [editing, setEditing] = useState(false);

  const windows = computeActivityWindows(config);

  const handleSave = () => {
    saveRoutineConfig(config);
    setEditing(false);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F0EFFF" }}>
      <div className="rounded-b-3xl px-4 pt-3 pb-6"
        style={{ background: "linear-gradient(135deg,#4361EE,#06D6A0)" }}>
        <button onClick={goBack} className="text-white/70 text-xs mb-3 flex items-center gap-1">
          <span>‹</span> Back
        </button>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">⏰</span>
          <div>
            <div className="text-white font-black text-xl">Daily Routine</div>
            <div className="text-white/60 text-xs">Optimal activity windows for {activeChild?.name ?? "your child"}</div>
          </div>
        </div>
        <div className="glass rounded-2xl p-3 flex items-center justify-between">
          <div className="text-white/80 text-xs">
            Wake {config.wakeTime} · Bed {config.bedTime}
            {config.napStart ? ` · Nap ${config.napStart}–${config.napEnd}` : ""}
          </div>
          <button onClick={() => setEditing(e => !e)}
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {editing && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-600 text-xs font-semibold block mb-1">Wake Time</label>
                <input type="time" value={config.wakeTime}
                  onChange={e => setConfig(c => ({ ...c, wakeTime: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-semibold block mb-1">Bed Time</label>
                <input type="time" value={config.bedTime}
                  onChange={e => setConfig(c => ({ ...c, bedTime: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-semibold block mb-1">Nap Start</label>
                <input type="time" value={config.napStart ?? ""}
                  onChange={e => setConfig(c => ({ ...c, napStart: e.target.value || undefined }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              </div>
              <div>
                <label className="text-gray-600 text-xs font-semibold block mb-1">Nap End</label>
                <input type="time" value={config.napEnd ?? ""}
                  onChange={e => setConfig(c => ({ ...c, napEnd: e.target.value || undefined }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-gray-600 text-xs font-semibold block mb-1">Energy Pattern</label>
              <div className="flex gap-2 flex-wrap">
                {(["morning-peak", "afternoon-peak", "even", "unknown"] as const).map(p => (
                  <button key={p} onClick={() => setConfig(c => ({ ...c, energyPattern: p }))}
                    className="text-xs px-3 py-1.5 rounded-full border"
                    style={{
                      borderColor: config.energyPattern === p ? "#4361EE" : "#e5e7eb",
                      background: config.energyPattern === p ? "rgba(67,97,238,0.08)" : "white",
                      color: config.energyPattern === p ? "#4361EE" : "#6B7280",
                    }}>
                    {p.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSave}
              className="w-full py-3 rounded-2xl text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>
              Save Routine
            </button>
          </div>
        )}

        <div>
          <div className="font-bold text-gray-800 text-sm mb-2">📅 Optimal Activity Windows</div>
          <DailySchedule windows={windows} />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="font-bold text-gray-800 text-sm mb-2">🧪 Science Behind Timing</div>
          <div className="space-y-2 text-xs text-gray-600">
            <p>• <strong>Morning cortisol peak</strong> supports logical and language processing</p>
            <p>• <strong>Post-nap alertness</strong> is ideal for physical and musical activities</p>
            <p>• <strong>Late afternoon</strong> favors social-emotional learning</p>
            <p>• <strong>Pre-bedtime calm</strong> activities support melatonin onset</p>
          </div>
        </div>
      </div>
    </div>
  );
}

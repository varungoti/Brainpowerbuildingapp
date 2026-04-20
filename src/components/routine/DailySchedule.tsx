import React from "react";
import type { ActivityWindow } from "../../lib/routine/routineOptimizer";

const WINDOW_COLORS: Record<string, string> = {
  "Morning Focus": "#4361EE",
  "Creative Window": "#7209B7",
  "Post-Nap Energy": "#06D6A0",
  "Social & Emotional": "#F72585",
  "Wind-Down": "#FFB703",
};

export function DailySchedule({ windows }: { windows: ActivityWindow[] }) {
  return (
    <div className="space-y-2">
      {windows.map((w) => {
        const color = WINDOW_COLORS[w.label] ?? "#4361EE";
        return (
          <div key={w.label} className="rounded-2xl p-3.5 border" style={{ borderColor: `${color}30`, background: `${color}08` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="font-bold text-gray-800 text-sm">{w.label}</span>
              </div>
              <span className="text-xs font-mono text-gray-500">{w.start} — {w.end}</span>
            </div>
            <div className="flex gap-1 flex-wrap mb-1.5">
              {w.bestRegions.map((r) => (
                <span key={r} className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                  {r.split("-")[0]}
                </span>
              ))}
            </div>
            <p className="text-gray-500" style={{ fontSize: 10 }}>{w.reason}</p>
          </div>
        );
      })}
    </div>
  );
}

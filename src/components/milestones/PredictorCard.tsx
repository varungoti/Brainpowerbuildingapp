import React from "react";
import type { MilestonePrediction } from "../../lib/milestones/milestonePredictor";

const STATUS_UI: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  "on-track": { color: "#059669", bg: "rgba(6,214,160,0.12)", label: "On Track", emoji: "✅" },
  "needs-attention": { color: "#D97706", bg: "rgba(245,158,11,0.12)", label: "Needs Attention", emoji: "⚠️" },
  "at-risk": { color: "#DC2626", bg: "rgba(220,38,38,0.12)", label: "At Risk", emoji: "🔴" },
};

export function PredictorCard({ predictions, onViewAll }: { predictions: MilestonePrediction[]; onViewAll?: () => void }) {
  if (predictions.length === 0) return null;
  const top = predictions.slice(0, 3);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "white", border: "1px solid #e5e7eb" }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#EEF1FF,#F5F0FF)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🔮</span>
          <span className="font-bold text-gray-800 text-sm">Milestone Predictions</span>
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-semibold" style={{ color: "#4361EE" }}>
            View All →
          </button>
        )}
      </div>
      <div className="p-3 space-y-2">
        {top.map((p) => {
          const ui = STATUS_UI[p.status];
          const months = Math.max(1, Math.round((new Date(p.expectedDate).getTime() - Date.now()) / (30 * 86400000)));
          return (
            <div key={p.milestoneId} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: ui.bg }}>
              <span className="text-xl">{ui.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-xs truncate">{p.title}</div>
                <div className="text-gray-500" style={{ fontSize: 10 }}>
                  Expected in ~{months} month{months !== 1 ? "s" : ""} · {p.confidencePercent}% confidence
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color: ui.color, background: `${ui.color}15` }}>
                {ui.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

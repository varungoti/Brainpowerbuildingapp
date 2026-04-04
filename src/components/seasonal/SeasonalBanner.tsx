import React, { useMemo } from "react";
import { detectSeason } from "../../lib/seasonal/seasonDetector";

interface Props {
  onExplore?: () => void;
}

export function SeasonalBanner({ onExplore }: Props) {
  const season = useMemo(() => detectSeason(), []);

  const bgGradients: Record<string, string> = {
    summer: "linear-gradient(135deg, #FCD34D22, #F59E0B22)",
    monsoon: "linear-gradient(135deg, #60A5FA22, #3B82F622)",
    autumn: "linear-gradient(135deg, #F9731622, #EA580C22)",
    winter: "linear-gradient(135deg, #A5B4FC22, #6366F122)",
    spring: "linear-gradient(135deg, #86EFAC22, #22C55E22)",
  };

  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-3"
      style={{ background: bgGradients[season.season] ?? bgGradients.summer }}
    >
      <span className="text-2xl">{season.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-800">{season.label} Activities</p>
        <p className="text-[10px] text-gray-500">Seasonal picks curated for your child</p>
      </div>
      {onExplore && (
        <button
          onClick={onExplore}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-medium text-white"
          style={{ background: "#4361EE" }}
        >
          Explore
        </button>
      )}
    </div>
  );
}

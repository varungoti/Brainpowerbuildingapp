import React from "react";

interface Props {
  badges: string[];
  warnings?: string[];
}

export function SensoryBadge({ badges, warnings }: Props) {
  if (badges.length === 0 && (!warnings || warnings.length === 0)) return null;

  return (
    <div className="space-y-1">
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {badges.map(b => (
            <span key={b} className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-teal-50 text-teal-700">
              🧩 {b}
            </span>
          ))}
        </div>
      )}
      {warnings && warnings.length > 0 && (
        <div className="space-y-0.5">
          {warnings.map((w, i) => (
            <p key={i} className="text-[10px] text-amber-600">⚠️ {w}</p>
          ))}
        </div>
      )}
    </div>
  );
}

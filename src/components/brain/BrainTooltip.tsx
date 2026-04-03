import React from "react";
import {
  BRAIN_REGIONS,
  getBrainRegionPercent,
} from "@/lib/brainRegions";

type Props = {
  hoveredId: string | null;
  scores: Record<string, number>;
};

export function BrainTooltip({ hoveredId, scores }: Props) {
  if (!hoveredId) return null;

  const region = BRAIN_REGIONS.find((item) => item.id === hoveredId);
  if (!region) return null;

  const percent = getBrainRegionPercent(scores[region.key] ?? 0);
  const isUpperHalf = region.labelY < 100;
  const left = `${(region.labelX / 380) * 100}%`;
  const top = `${(region.labelY / 320) * 100}%`;

  return (
    <div
      className="pointer-events-none absolute z-20 w-56 max-w-[78%]"
      style={{
        left,
        top,
        transform: isUpperHalf ? "translate(-50%, 12px)" : "translate(-50%, calc(-100% - 12px))",
      }}
    >
      <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">
              {region.emoji} {region.name}
            </div>
            <div className="text-[11px] text-slate-500">{region.lobe}</div>
          </div>
          <div
            className="rounded-full px-2 py-1 text-[11px] font-bold"
            style={{ backgroundColor: region.color, color: "rgb(15,23,42)" }}
          >
            {percent}%
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{region.desc}</p>
      </div>
    </div>
  );
}

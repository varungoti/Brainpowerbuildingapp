import React from "react";
import {
  BRAIN_REGIONS,
  getBrainRegionPercent,
} from "@/lib/brainRegions";
import { getAccessiblePillStyle } from "@/lib/brain/contrast";

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
            <div className="truncate text-[11px] font-medium text-slate-600">
              {region.key}
            </div>
            <div className="truncate text-[10px] text-slate-400">{region.lobe}</div>
          </div>
          {(() => {
            const pill = getAccessiblePillStyle(region.color);
            return (
              <div
                className="rounded-full px-2 py-1 text-[11px] font-bold"
                style={{ backgroundColor: pill.background, color: pill.color }}
              >
                {percent}%
              </div>
            );
          })()}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{region.desc}</p>
      </div>
    </div>
  );
}

import React from "react";
import {
  BRAIN_REGIONS,
  getBrainRegionPercent,
  type BrainRegion,
} from "@/lib/brainRegions";

type Props = {
  scores: Record<string, number>;
  /** Optional hovered/selected id to highlight the matching legend cell. */
  activeId?: string | null;
  onRegionHover?: (id: string | null) => void;
  onRegionSelect?: (id: string) => void;
  className?: string;
};

/**
 * Legend grid that names every region, its color swatch, its underlying
 * intelligence key, and the child's current coverage %. Required because the
 * SVG overlay no longer paints text labels on the brain itself — the legend is
 * now the single place those mappings are surfaced.
 */
export function BrainLegend({
  scores,
  activeId,
  onRegionHover,
  onRegionSelect,
  className = "",
}: Props) {
  const items: BrainRegion[] = [...BRAIN_REGIONS];

  return (
    <section
      aria-label="Brain region legend"
      className={`mx-4 mt-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm ${className}`}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Region Legend
        </h3>
        <span className="text-[10px] text-slate-400">
          Color · Region · Intelligence
        </span>
      </div>

      <ul
        role="list"
        className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
      >
        {items.map((region) => {
          const percent = getBrainRegionPercent(scores[region.key] ?? 0);
          const isActive = activeId === region.id;
          return (
            <li key={region.id}>
              <button
                type="button"
                onPointerEnter={() => onRegionHover?.(region.id)}
                onPointerLeave={() => onRegionHover?.(null)}
                onFocus={() => onRegionHover?.(region.id)}
                onBlur={() => onRegionHover?.(null)}
                onClick={() => onRegionSelect?.(region.id)}
                aria-pressed={isActive}
                aria-label={`${region.name} — ${region.key}, ${percent}% coverage`}
                className={`flex w-full items-center gap-2.5 rounded-xl border px-2 py-1.5 text-left transition-colors ${
                  isActive
                    ? "border-slate-300 bg-slate-50"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <span
                  aria-hidden
                  className="inline-block h-3.5 w-3.5 flex-shrink-0 rounded-full border border-white shadow"
                  style={{ background: region.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[11px]" aria-hidden>
                      {region.emoji}
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-800">
                      {region.name}
                    </span>
                  </span>
                  <span className="block truncate text-[10px] text-slate-500">
                    {region.key}
                  </span>
                </span>
                <span
                  className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background: percent > 0 ? `${region.color}22` : "#F1F5F9",
                    // Slate-700 on the 13% region tint over white passes
                    // WCAG AA for every region color (verified by
                    // src/lib/brain/contrast.test.ts). Previously we drew
                    // the region color on a tint of itself, which failed
                    // AA badly for light pastels like #D9DD67.
                    color: "#334155",
                  }}
                >
                  {percent}%
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

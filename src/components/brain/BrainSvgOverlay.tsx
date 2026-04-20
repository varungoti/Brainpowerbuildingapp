import React, { forwardRef, useMemo } from "react";
import {
  BRAIN_REGION_VISUALS,
  BRAIN_REGIONS,
  type BrainRegion,
} from "@/lib/brainRegions";

/**
 * Viewbox dimensions come from the source illustration and MUST match
 * BrainCanvas.VIEW_WIDTH / VIEW_HEIGHT so overlay paths align with pixels.
 */
export const OVERLAY_VIEW_WIDTH = 380;
export const OVERLAY_VIEW_HEIGHT = 320;

type Props = {
  /** Current hover target; drives the subtle outline + tooltip. */
  hoveredId: string | null;
  /** Currently selected region; shown with a stronger outline. */
  selectedId: string | null;
  /** Hover callback — fires on pointer enter and keyboard focus. */
  onHover: (id: string | null) => void;
  /** Fires when a region is activated (click or Enter/Space). */
  onSelect: (id: string) => void;
  className?: string;
};

function buildCombinedPath(region: BrainRegion): string {
  const visual = BRAIN_REGION_VISUALS[region.id];
  if (!visual) return "";
  return visual.paths.join(" ");
}

/**
 * Transparent-fill SVG layer stacked on top of the canvas that owns all
 * interaction. Each region is a focusable path with a proper aria-label and
 * keyboard support, matching the canvas-based hover/select behaviour that
 * used to be driven by pixel-voting. Removing that voting path also kills the
 * duplicate COLOR_MAP in BrainCanvas.
 */
export const BrainSvgOverlay = forwardRef<SVGSVGElement, Props>(function BrainSvgOverlay(
  { hoveredId, selectedId, onHover, onSelect, className = "" },
  ref,
) {
  const regionList = useMemo(
    () =>
      BRAIN_REGIONS.map((r) => ({
        region: r,
        d: buildCombinedPath(r),
      })).filter((x) => x.d.length > 0),
    [],
  );

  const focusOrder = useMemo(
    () =>
      [...regionList].sort((a, b) => {
        if (a.region.cy !== b.region.cy) return a.region.cy - b.region.cy;
        return a.region.cx - b.region.cx;
      }),
    [regionList],
  );

  const handleKey = (e: React.KeyboardEvent<SVGPathElement>, regionId: string) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      onSelect(regionId);
      return;
    }
    if (e.key === "Escape") {
      onHover(null);
      return;
    }
    if (
      e.key === "ArrowRight" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "Tab"
    ) {
      if (e.key === "Tab") return;
      e.preventDefault();
      const idx = focusOrder.findIndex((x) => x.region.id === regionId);
      if (idx < 0) return;
      const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
      const next = focusOrder[(idx + step + focusOrder.length) % focusOrder.length];
      const nextEl = (e.currentTarget.ownerSVGElement ?? e.currentTarget.ownerDocument)
        ?.querySelector<SVGPathElement>(`[data-region-id="${next.region.id}"]`);
      nextEl?.focus();
      onHover(next.region.id);
    }
  };

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${OVERLAY_VIEW_WIDTH} ${OVERLAY_VIEW_HEIGHT}`}
      className={`pointer-events-none h-full w-full ${className}`}
      role="group"
      aria-label="Brain regions"
    >
      {regionList.map(({ region, d }) => {
        const isHovered = hoveredId === region.id;
        const isSelected = selectedId === region.id;
        const stroke = isSelected
          ? region.color
          : isHovered
            ? "rgba(30,41,59,0.4)"
            : "transparent";
        const strokeWidth = isSelected ? 2.2 : isHovered ? 1.4 : 0;
        return (
          <path
            key={region.id}
            data-region-id={region.id}
            d={d}
            fill="transparent"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            tabIndex={0}
            role="button"
            aria-label={`${region.name} — ${region.key}`}
            aria-pressed={isSelected}
            style={{
              pointerEvents: "auto",
              cursor: "pointer",
              outline: "none",
              transition: "stroke 140ms ease, stroke-width 140ms ease",
            }}
            onPointerEnter={() => onHover(region.id)}
            onPointerLeave={() => onHover(null)}
            onPointerDown={(e) => {
              // Prevent the underlying canvas from also receiving the event
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(region.id);
            }}
            onFocus={() => onHover(region.id)}
            onBlur={() => onHover(null)}
            onKeyDown={(e) => handleKey(e, region.id)}
          />
        );
      })}
    </svg>
  );
});

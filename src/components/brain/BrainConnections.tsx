import React from "react";
import { motion } from "motion/react";
import {
  BRAIN_REGION_CONNECTIONS,
  BRAIN_REGIONS,
  MAX_BRAIN_REGION_SCORE,
} from "@/lib/brainRegions";

type Props = {
  scores: Record<string, number>;
  hoveredId: string | null;
  selectedId: string | null;
};

function connectionIsHighlighted(sourceId: string, targetId: string, hoveredId: string | null, selectedId: string | null) {
  return hoveredId === sourceId || hoveredId === targetId || selectedId === sourceId || selectedId === targetId;
}

export function BrainConnections({ scores, hoveredId, selectedId }: Props) {
  return (
    <g aria-hidden="true">
      {BRAIN_REGION_CONNECTIONS.map(([sourceIndex, targetIndex], index) => {
        const source = BRAIN_REGIONS[sourceIndex];
        const target = BRAIN_REGIONS[targetIndex];
        const sourcePercent = Math.max(0, Math.min(1, (scores[source.key] ?? 0) / MAX_BRAIN_REGION_SCORE));
        const targetPercent = Math.max(0, Math.min(1, (scores[target.key] ?? 0) / MAX_BRAIN_REGION_SCORE));
        const intensity = Math.max(sourcePercent, targetPercent);
        const highlighted = connectionIsHighlighted(source.id, target.id, hoveredId, selectedId);
        const opacity = highlighted ? 0.8 : 0.18 + intensity * 0.34;
        const stroke = highlighted ? "rgb(51,65,85)" : "rgb(148,163,184)";
        const strokeWidth = highlighted ? 2 : 1 + intensity * 0.9;

        return (
          <g key={`${source.id}-${target.id}`}>
            <line
              x1={source.cx}
              y1={source.cy}
              x2={target.cx}
              y2={target.cy}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
              strokeDasharray="6 6"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="12;0"
                dur={`${2.2 + index * 0.14}s`}
                repeatCount="indefinite"
              />
            </line>
            {intensity > 0.15 && (
              <motion.circle
                r={highlighted ? 3 : 2.2}
                fill={highlighted ? "rgb(15,23,42)" : "white"}
                fillOpacity={highlighted ? 0.9 : 0.7}
                animate={{
                  cx: [source.cx, target.cx],
                  cy: [source.cy, target.cy],
                }}
                transition={{
                  duration: 2.3 + index * 0.18,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                  ease: "linear",
                  delay: index * 0.06,
                }}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

// ============================================================================
// CompetencyRadar
// ----------------------------------------------------------------------------
// 12-spoke radar chart over the AI-Age Readiness competencies.
//
// Visual decisions:
//   - Concentric polygons at 25 / 50 / 75 / 100 % so the parent has reference
//     gridlines without an axis legend that would clutter the small canvas.
//   - The two weakest competencies get a gold ring + label dot to make the
//     "Today's Focus" recommendation legible from the chart alone.
//   - The two strongest get a teal ring + label dot so wins are visible.
//   - Tap any spoke / dot to surface the CompetencyDetailModal — citations are
//     never more than one tap away (the framework's anti-overclaim guarantee).
//
// Pure presentational; the parent screen owns scores + selection state.
// ============================================================================

import React from "react";
import {
  AI_AGE_COMPETENCIES,
  COMPETENCY_SCORE_MAX,
  getCompetencyPercent,
  pickPriorityCompetencies,
  type AIAgeCompetency,
  type AIAgeCompetencyId,
} from "../../lib/competencies/aiAgeCompetencies";

interface Props {
  scores: Record<string, number> | undefined;
  /** Override priority calculation if the parent screen wants to highlight
   *  something else (e.g. "today's chosen focus"). Defaults to bottom-2. */
  priorityIds?: AIAgeCompetencyId[];
  onSelect?: (competency: AIAgeCompetency) => void;
  /** Compact size variant for cards & chips; default is the full panel. */
  size?: "compact" | "full";
}

const CX = 160;
const CY = 160;
const MAX_R = 120;
const VIEW = 320;

export function CompetencyRadar({ scores, priorityIds, onSelect, size = "full" }: Props) {
  const safe = scores ?? {};
  const n = AI_AGE_COMPETENCIES.length;
  const angleStep = (2 * Math.PI) / n;

  const weakest = priorityIds ?? pickPriorityCompetencies(safe, 2);
  const strongest = [...AI_AGE_COMPETENCIES]
    .map((c) => ({ id: c.id, score: safe[c.id] ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .filter((entry) => entry.score > 0)
    .map((entry) => entry.id);

  const points = AI_AGE_COMPETENCIES.map((c, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const score = safe[c.id] ?? 0;
    const pct = Math.min(1, score / COMPETENCY_SCORE_MAX);
    return {
      competency: c,
      angle,
      pct,
      score,
      x: CX + Math.cos(angle) * MAX_R * pct,
      y: CY + Math.sin(angle) * MAX_R * pct,
      lx: CX + Math.cos(angle) * (MAX_R + 24),
      ly: CY + Math.sin(angle) * (MAX_R + 24),
      ax: CX + Math.cos(angle) * MAX_R,
      ay: CY + Math.sin(angle) * MAX_R,
    };
  });

  const polyPoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const rings = [0.25, 0.5, 0.75, 1];

  const chartHeight = size === "compact" ? 220 : 320;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="w-full"
        style={{ maxHeight: chartHeight }}
        role="img"
        aria-label={`AI-Age Readiness radar across ${n} competencies`}
      >
        <defs>
          <linearGradient id="aiAgeRadarFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(67,97,238,0.18)" />
            <stop offset="100%" stopColor="rgba(114,9,183,0.22)" />
          </linearGradient>
          <linearGradient id="aiAgeRadarStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4361EE" />
            <stop offset="100%" stopColor="#7209B7" />
          </linearGradient>
        </defs>

        {/* Reference rings */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={AI_AGE_COMPETENCIES.map((_, i) => {
              const angle = -Math.PI / 2 + i * angleStep;
              return `${CX + Math.cos(angle) * MAX_R * r},${CY + Math.sin(angle) * MAX_R * r}`;
            }).join(" ")}
            fill="none"
            stroke={r === 1 ? "#CBD5E1" : "#E2E8F0"}
            strokeWidth={r === 1 ? 0.8 : 0.5}
          />
        ))}

        {/* Spokes */}
        {points.map((p) => (
          <line
            key={`spoke-${p.competency.id}`}
            x1={CX}
            y1={CY}
            x2={p.ax}
            y2={p.ay}
            stroke="#E2E8F0"
            strokeWidth="0.5"
          />
        ))}

        {/* Score polygon */}
        <polygon points={polyPoints} fill="url(#aiAgeRadarFill)" stroke="url(#aiAgeRadarStroke)" strokeWidth="1.6" />

        {/* Per-competency dots + labels */}
        {points.map((p) => {
          const isWeakest = weakest.includes(p.competency.id);
          const isStrongest = strongest.includes(p.competency.id);
          const ringColor = isWeakest ? "#FFB703" : isStrongest ? "#06D6A0" : null;

          return (
            <g
              key={p.competency.id}
              tabIndex={onSelect ? 0 : undefined}
              role={onSelect ? "button" : undefined}
              aria-label={`${p.competency.label}: ${getCompetencyPercent(p.score)}%`}
              onClick={onSelect ? () => onSelect(p.competency) : undefined}
              onKeyDown={
                onSelect
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(p.competency);
                      }
                    }
                  : undefined
              }
              style={{ cursor: onSelect ? "pointer" : "default", outline: "none" }}
            >
              {ringColor && (
                <circle cx={p.x} cy={p.y} r={7.5} fill="none" stroke={ringColor} strokeWidth={1.6} opacity={0.85} />
              )}
              <circle cx={p.x} cy={p.y} r={3.5} fill={p.competency.color} stroke="white" strokeWidth={1} />
              <text x={p.lx} y={p.ly} textAnchor="middle" fontSize={11} fill="#475569">
                {p.competency.emoji}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend rings */}
      <div className="mt-2 flex items-center justify-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full border-[1.5px]" style={{ borderColor: "#FFB703" }} />
          Today's focus
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full border-[1.5px]" style={{ borderColor: "#06D6A0" }} />
          Top strengths
        </span>
      </div>
    </div>
  );
}

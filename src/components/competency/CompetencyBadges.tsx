// ============================================================================
// CompetencyBadges
// ----------------------------------------------------------------------------
// Inline chip strip rendering the AI-Age competencies an activity develops.
//
// Used in:
//   - ActivityDetailScreen header → so the parent sees "what is this building"
//     before they read the steps
//   - Pack cards (compact variant) → so generator output is honest about the
//     dimensions it's exercising
//
// Badges are tappable when `onSelect` is provided, opening
// CompetencyDetailModal at the call site.
// ============================================================================

import React from "react";
import {
  AI_AGE_COMPETENCIES,
  type AIAgeCompetencyId,
  type AIAgeCompetency,
} from "../../lib/competencies/aiAgeCompetencies";

const COMP_BY_ID: Record<AIAgeCompetencyId, AIAgeCompetency> = AI_AGE_COMPETENCIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<AIAgeCompetencyId, AIAgeCompetency>,
);

interface Props {
  ids: AIAgeCompetencyId[];
  onSelect?: (competency: AIAgeCompetency) => void;
  /** "compact" hides label text and shows only emoji+color dots — for pack cards. */
  variant?: "compact" | "full";
  /** Label shown above the chip strip; defaults to nothing. */
  heading?: string;
}

export function CompetencyBadges({ ids, onSelect, variant = "full", heading }: Props) {
  if (!ids || ids.length === 0) return null;
  const seen = new Set<AIAgeCompetencyId>();
  const items = ids
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return Boolean(COMP_BY_ID[id]);
    })
    .map((id) => COMP_BY_ID[id]);

  if (items.length === 0) return null;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {items.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={onSelect ? () => onSelect(c) : undefined}
            disabled={!onSelect}
            aria-label={`Develops ${c.label}`}
            title={c.label}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px]"
            style={{ background: `${c.color}20`, border: `1px solid ${c.color}40` }}
          >
            {c.emoji}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      {heading && (
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{heading}</div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        {items.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={onSelect ? () => onSelect(c) : undefined}
            disabled={!onSelect}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-transform active:scale-95"
            style={{
              background: `${c.color}14`,
              color: c.color,
              border: `1px solid ${c.color}30`,
              cursor: onSelect ? "pointer" : "default",
            }}
            aria-label={`Develops ${c.label}${onSelect ? " — tap for definition" : ""}`}
          >
            <span aria-hidden="true">{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

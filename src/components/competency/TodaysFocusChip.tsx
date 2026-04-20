// ============================================================================
// TodaysFocusChip
// ----------------------------------------------------------------------------
// Home-screen entrypoint to the AI-Age Readiness framework.
//
// Surfaces the child's two priority (currently weakest) competencies with a
// one-line "why" and a tap target that opens the CompetencyDetailModal. This
// is the primary way a parent discovers the framework — the framework's
// "Phase A" definition of done in FUTURE_ROADMAP.md §0.5.
//
// We deliberately surface *only two* dimensions, not the full radar, to
// avoid the overwhelm risk called out in §0.7.
// ============================================================================

import React, { useState, useMemo } from "react";
import {
  AI_AGE_COMPETENCIES,
  pickPriorityCompetencies,
  getCompetencyPercent,
  type AIAgeCompetency,
  type AIAgeCompetencyId,
} from "../../lib/competencies/aiAgeCompetencies";
import { CompetencyDetailModal } from "./CompetencyDetailModal";

interface Props {
  scores: Record<string, number> | undefined;
  childName?: string;
  /** Called when the parent taps "See activity" — caller routes to the
   *  generator with the chosen priority competencies pre-selected. */
  onPracticeNow?: (competencyIds: AIAgeCompetencyId[]) => void;
}

const COMP_BY_ID: Record<AIAgeCompetencyId, AIAgeCompetency> = AI_AGE_COMPETENCIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<AIAgeCompetencyId, AIAgeCompetency>,
);

export function TodaysFocusChip({ scores, childName, onPracticeNow }: Props) {
  const [open, setOpen] = useState<AIAgeCompetency | null>(null);
  const priorityIds = useMemo(() => pickPriorityCompetencies(scores, 2), [scores]);
  const priorities = priorityIds.map((id) => COMP_BY_ID[id]).filter(Boolean);
  if (priorities.length === 0) return null;

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "white", border: "1px solid #e5e7eb", boxShadow: "0 8px 22px rgba(67,97,238,0.06)" }}
      >
        <div
          className="px-4 py-2.5 flex items-center gap-2"
          style={{ background: "linear-gradient(135deg,#FFFBEB,#F5F3FF)" }}
        >
          <span className="text-base">🌟</span>
          <span className="font-bold text-slate-700 text-xs">
            Today's AI-age focus{childName ? ` for ${childName}` : ""}
          </span>
          <span
            className="ml-auto inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
            style={{ background: "rgba(255,183,3,0.18)", color: "#B45309" }}
          >
            Evidence-based
          </span>
        </div>

        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          {priorities.map((c) => {
            const pct = getCompetencyPercent(scores?.[c.id]);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setOpen(c)}
                className="flex items-start gap-3 p-3 rounded-xl text-left transition-transform active:scale-[0.98]"
                style={{ background: `${c.color}0E`, border: `1px solid ${c.color}30` }}
                aria-label={`${c.label} — ${pct}% developed. Tap for details.`}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${c.color}22` }}
                >
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-xs leading-tight">{c.label}</div>
                  <div className="text-slate-500 text-[10px] mt-0.5 leading-snug line-clamp-2">{c.whyAIAge}</div>
                  <div className="mt-1.5 h-1 rounded-full bg-white overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(pct, 4)}%`, background: c.color }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {onPracticeNow && (
          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={() => onPracticeNow(priorityIds)}
              className="w-full py-2 rounded-xl text-white font-bold text-xs"
              style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
            >
              Practice today's focus →
            </button>
          </div>
        )}
      </div>
      <CompetencyDetailModal competency={open} score={open ? scores?.[open.id] : undefined} onClose={() => setOpen(null)} />
    </>
  );
}

// ============================================================================
// CompetencyDetailModal
// ----------------------------------------------------------------------------
// Bottom-sheet modal that surfaces the *full* definition + research evidence
// for a single AI-Age Readiness competency.
//
// Why this exists:
//   - Anti-overclaim guarantee from FUTURE_ROADMAP.md §0.7: "every competency
//     has its citations baked into the source of truth; the UI surfaces them
//     on tap." This component is that tap.
//   - Lives in `src/components/competency/` next to CompetencyRadar so any
//     surface that shows competency chips can wire the same modal in 1 line.
//
// Accessibility:
//   - Uses role=dialog + aria-modal. Backdrop click + Esc both close.
//   - Focus is restored to the document body on close (body owns focus
//     restoration, not the modal — caller can restore explicitly if needed).
// ============================================================================

import React, { useEffect } from "react";
import {
  COMPETENCY_SCORE_MAX,
  getCompetencyPercent,
  type AIAgeCompetency,
} from "../../lib/competencies/aiAgeCompetencies";

interface Props {
  competency: AIAgeCompetency | null;
  score?: number;
  onClose: () => void;
}

export function CompetencyDetailModal({ competency, score, onClose }: Props) {
  useEffect(() => {
    if (!competency) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [competency, onClose]);

  if (!competency) return null;

  const pct = getCompetencyPercent(score);
  const safeScore = Math.max(0, Math.min(COMPETENCY_SCORE_MAX, score ?? 0));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={competency.label}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ borderTop: `4px solid ${competency.color}` }}
      >
        <div className="sticky top-0 z-10 flex items-start gap-3 p-4 bg-white/95 backdrop-blur border-b border-slate-100">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${competency.color}18` }}
          >
            {competency.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-black text-slate-900 text-base leading-tight">{competency.label}</div>
            <div className="text-slate-500 text-xs mt-0.5">AI-Age Readiness · Dimension</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {typeof score === "number" && (
            <div className="rounded-2xl p-3" style={{ background: `${competency.color}10` }}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600">Current development</span>
                <span className="text-base font-black" style={{ color: competency.color }}>
                  {pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: competency.color }}
                />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Score {safeScore.toFixed(1)} / {COMPETENCY_SCORE_MAX} · weighted by engagement across recent activities
              </div>
            </div>
          )}

          <Section title="What this means">
            <p className="text-sm text-slate-600 leading-relaxed">{competency.definition}</p>
          </Section>

          <Section title="Why it matters in the AI age">
            <p className="text-sm text-slate-600 leading-relaxed">{competency.whyAIAge}</p>
          </Section>

          <Section title="At your child's age">
            <p className="text-sm text-slate-600 leading-relaxed">{competency.ageNotes}</p>
          </Section>

          <Section title="Research basis">
            <ul className="space-y-1.5">
              {competency.evidence.map((cite) => (
                <li key={cite} className="text-xs text-slate-500 flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-300 mt-0.5">▸</span>
                  <span>{cite}</span>
                </li>
              ))}
            </ul>
          </Section>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl font-bold text-white text-sm"
            style={{ background: `linear-gradient(135deg, ${competency.color}, #4361EE)` }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{title}</div>
      {children}
    </div>
  );
}

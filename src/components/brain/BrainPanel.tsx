import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CoachPanel } from "@/components/coach/CoachPanel";
import { useApp } from "@/app/context/AppContext";
import {
  BRAIN_REGIONS,
  getBrainRegionPercent,
  MAX_BRAIN_REGION_SCORE,
} from "@/lib/brainRegions";
import { generateInsights } from "@/lib/brainInsights";

type Props = {
  selectedId: string | null;
  scores: Record<string, number>;
  onClose: () => void;
};

export function BrainPanel({ selectedId, scores, onClose }: Props) {
  const { activeChild, hasCreditForToday } = useApp();
  const region = BRAIN_REGIONS.find((item) => item.id === selectedId);
  const insights = generateInsights(scores);
  const [coachOpen, setCoachOpen] = useState(false);
  const coachProfile = useMemo(() => {
    if (!activeChild) return null;
    return {
      age: Math.max(
        1,
        Math.floor((Date.now() - new Date(activeChild.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      ),
      name: activeChild.name,
      goals: region ? [`Support ${region.name.toLowerCase()} growth`] : undefined,
    };
  }, [activeChild, region]);
  const isPremium = hasCreditForToday();

  return (
    <AnimatePresence>
      {region && (
        <>
          <motion.aside
            key={region.id}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-y-3 right-3 z-30 w-[min(18rem,calc(100%-1.5rem))] overflow-y-auto rounded-3xl border border-slate-200 bg-white/96 p-4 shadow-2xl backdrop-blur"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-medium text-slate-500">{region.lobe}</div>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  {region.emoji} {region.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">{region.desc}</p>

            <div className="mt-4 rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Current score</span>
                <span>
                  {scores[region.key] ?? 0}/{MAX_BRAIN_REGION_SCORE}
                </span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-slate-200">
                <motion.div
                  className="h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getBrainRegionPercent(scores[region.key] ?? 0)}%` }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  style={{ backgroundColor: region.color }}
                />
              </div>
              <div className="mt-2 text-right text-xs font-semibold text-slate-500">
                {getBrainRegionPercent(scores[region.key] ?? 0)}%
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCoachOpen(true)}
              className="mt-4 w-full rounded-2xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white"
            >
              Ask AI Coach
            </button>

            <div className="mt-4 space-y-3">
              {insights.map((insight) => (
                <div
                  key={`${insight.type}-${insight.regionId}`}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {insight.type === "strength" ? "AI Strength Insight" : "AI Improvement Insight"}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{insight.text}</p>
                </div>
              ))}
            </div>
          </motion.aside>

          {coachProfile && (
            <CoachPanel
              open={coachOpen}
              onClose={() => setCoachOpen(false)}
              profile={coachProfile}
              scores={scores}
              isPremium={isPremium}
              initialQuestion={`How can I support ${region.name.toLowerCase()} development right now?`}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

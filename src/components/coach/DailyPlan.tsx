import React, { useMemo } from "react";
import type { CoachPlanItem } from "@/lib/coach/generateCoachPrompt";

type Props = {
  items: CoachPlanItem[];
  isPremium: boolean;
};

const SECTIONS: CoachPlanItem["timeOfDay"][] = ["morning", "afternoon", "evening"];

export function DailyPlan({ items, isPremium }: Props) {
  const grouped = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((timeOfDay) => [
          timeOfDay,
          items.filter((item) => item.timeOfDay === timeOfDay),
        ]),
      ) as Record<CoachPlanItem["timeOfDay"], CoachPlanItem[]>,
    [items],
  );

  return (
    <div className="space-y-3">
      {SECTIONS.map((timeOfDay) => {
        const sectionItems = grouped[timeOfDay];
        if (!sectionItems.length) return null;

        return (
          <div key={timeOfDay} className="rounded-2xl bg-slate-50 p-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              {timeOfDay}
            </div>
            <div className="mt-2 space-y-2">
              {sectionItems.map((item, index) => {
                const locked = !isPremium && index > 0;
                return (
                  <div
                    key={`${item.timeOfDay}-${item.title}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-3"
                    style={{ filter: locked ? "blur(2px)" : undefined, opacity: locked ? 0.6 : 1 }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                      <div className="text-[11px] font-bold text-slate-400">{item.duration}</div>
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-indigo-600">{item.regionKey}</div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!isPremium && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          Premium unlocks the full daily plan and deeper coaching detail. The wiring is ready through the `isPremium` flag.
        </div>
      )}
    </div>
  );
}

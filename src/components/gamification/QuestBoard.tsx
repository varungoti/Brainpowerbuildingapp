import React from "react";
import type { Quest } from "../../lib/gamification/questEngine";
import { isQuestComplete, isQuestExpired } from "../../lib/gamification/questEngine";

const TYPE_UI: Record<string, { color: string; label: string }> = {
  daily: { color: "#4361EE", label: "Daily" },
  weekly: { color: "#7209B7", label: "Weekly" },
  monthly: { color: "#F72585", label: "Monthly" },
  special: { color: "#FFB703", label: "Special" },
};

export function QuestBoard({ quests }: { quests: Quest[] }) {
  const active = quests.filter(q => !isQuestExpired(q));
  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {active.map((quest) => {
        const complete = isQuestComplete(quest);
        const ui = TYPE_UI[quest.type] ?? TYPE_UI.daily;
        const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100));

        return (
          <div key={quest.id} className="rounded-2xl p-3.5 border transition-all"
            style={{
              background: complete ? "rgba(6,214,160,0.08)" : "white",
              borderColor: complete ? "rgba(6,214,160,0.3)" : "#e5e7eb",
              opacity: complete ? 0.8 : 1,
            }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{complete ? "✅" : quest.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-sm truncate">{quest.title}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${ui.color}15`, color: ui.color }}>
                    {ui.label}
                  </span>
                </div>
                <p className="text-gray-500 text-xs">{quest.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-sm" style={{ color: ui.color }}>+{quest.rewardBP}</div>
                <div className="text-gray-400" style={{ fontSize: 9 }}>BP</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: complete ? "#06D6A0" : ui.color }} />
              </div>
              <span className="text-xs font-bold text-gray-500 w-12 text-right">
                {quest.progress}/{quest.target}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import React from "react";
import { useApp } from "../context/AppContext";
import { QuestBoard } from "../../components/gamification/QuestBoard";
import { getStreakMultiplier } from "../../lib/gamification/streakSystem";

export function QuestsScreen() {
  const { activeChild, goBack, quests, enhancedStreak } = useApp();
  const streak = enhancedStreak;
  const multiplier = streak ? getStreakMultiplier(streak) : 1.0;
  const activeQuests = quests;

  const dailyQuests = activeQuests.filter(q => q.type === "daily");
  const weeklyQuests = activeQuests.filter(q => q.type === "weekly");
  const monthlyQuests = activeQuests.filter(q => q.type === "monthly");

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F0EFFF" }}>
      <div className="rounded-b-3xl px-4 pt-3 pb-6"
        style={{ background: "linear-gradient(135deg,#FFB703,#FB5607)" }}>
        <button onClick={goBack} className="text-white/70 text-xs mb-3 flex items-center gap-1">
          <span>‹</span> Back
        </button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">🏆</span>
          <div>
            <div className="text-white font-black text-xl">Quests & Challenges</div>
            <div className="text-white/60 text-xs">Earn BP and badges for {activeChild?.name ?? "your child"}</div>
          </div>
        </div>

        {streak && (
          <div className="glass rounded-2xl p-3 flex items-center gap-3">
            <div className="text-center">
              <div className="text-white font-black text-2xl">{streak.currentDays}</div>
              <div className="text-white/60" style={{ fontSize: 9 }}>Streak</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-white font-black text-lg">{streak.longestEver}</div>
              <div className="text-white/60" style={{ fontSize: 9 }}>Best</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-white font-black text-lg">{streak.freezesAvailable}</div>
              <div className="text-white/60" style={{ fontSize: 9 }}>Freezes</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <div className="text-white font-black text-lg">{multiplier}x</div>
              <div className="text-white/60" style={{ fontSize: 9 }}>Multiplier</div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {dailyQuests.length > 0 && (
          <div>
            <div className="font-bold text-gray-800 text-sm mb-2">📋 Daily Quests</div>
            <QuestBoard quests={dailyQuests} />
          </div>
        )}

        {weeklyQuests.length > 0 && (
          <div>
            <div className="font-bold text-gray-800 text-sm mb-2">📅 Weekly Challenges</div>
            <QuestBoard quests={weeklyQuests} />
          </div>
        )}

        {monthlyQuests.length > 0 && (
          <div>
            <div className="font-bold text-gray-800 text-sm mb-2">🌟 Monthly Goals</div>
            <QuestBoard quests={monthlyQuests} />
          </div>
        )}

        {activeQuests.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <span className="text-4xl mb-3 block">🎯</span>
            <div className="font-bold text-gray-700 mb-1">No Active Quests</div>
            <p className="text-gray-400 text-xs">Quests refresh daily. Complete an activity to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

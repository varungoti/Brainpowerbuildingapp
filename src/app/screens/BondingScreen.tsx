import React from "react";
import { useApp } from "../context/AppContext";
import { computeBondingHistory, getBondingInsight, computeWeeklyBondingScore } from "../../lib/bonding/bondingAnalytics";

export function BondingScreen() {
  const { activeChild, activityLogs, goBack } = useApp();

  if (!activeChild) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500 text-sm">No child selected</p>
      </div>
    );
  }

  const history = computeBondingHistory(activityLogs, activeChild.id);
  const recentLogs = activityLogs.filter(l =>
    l.childId === activeChild.id && l.completed &&
    Date.now() - new Date(l.date).getTime() < 7 * 86400000
  );
  const currentScore = computeWeeklyBondingScore(recentLogs);
  const insight = getBondingInsight(currentScore);
  const allJoy = recentLogs.flatMap(l => l.joyMoments ?? []).slice(0, 5);

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F0EFFF" }}>
      <div className="rounded-b-3xl px-4 pt-3 pb-6"
        style={{ background: "linear-gradient(135deg,#F72585,#7209B7)" }}>
        <button onClick={goBack} className="text-white/70 text-xs mb-3 flex items-center gap-1">
          <span>‹</span> Back
        </button>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{insight.emoji}</span>
          <div>
            <div className="text-white font-black text-xl">Bonding Journey</div>
            <div className="text-white/60 text-xs">{activeChild.name}'s parent-child connection</div>
          </div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/70 text-xs">This Week's Score</span>
            <span className="text-white font-black text-2xl">{currentScore}</span>
          </div>
          <div className="h-3 rounded-full bg-white/20 overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all" style={{ width: `${currentScore}%`, background: "linear-gradient(90deg,#FFB703,#06D6A0)" }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
              {insight.label}
            </span>
            <span className="text-white/60 text-xs flex-1">{insight.message}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {allJoy.length > 0 && (
          <div>
            <div className="font-bold text-gray-800 text-sm mb-2">✨ Joy Moments This Week</div>
            <div className="space-y-1.5">
              {allJoy.map((j, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-2">
                  <span>💛</span>
                  <span className="text-gray-700 text-xs">{j}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="font-bold text-gray-800 text-sm mb-2">📊 Weekly History</div>
          {history.length > 0 ? (
            <div className="space-y-1.5">
              {history.map((w) => {
                const trendEmoji = w.trend === "improving" ? "📈" : w.trend === "declining" ? "📉" : "➡️";
                return (
                  <div key={w.weekStart} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                    <span className="text-lg">{trendEmoji}</span>
                    <div className="flex-1">
                      <div className="text-gray-700 text-xs font-semibold">Week of {w.weekStart}</div>
                      <div className="text-gray-400" style={{ fontSize: 10 }}>
                        {w.joyMoments.length} joy moment{w.joyMoments.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-sm" style={{ color: w.score >= 60 ? "#06D6A0" : w.score >= 30 ? "#FFB703" : "#F72585" }}>
                        {w.score}
                      </div>
                      <div className="text-gray-400" style={{ fontSize: 9 }}>/100</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
              <span className="text-3xl mb-2 block">🤗</span>
              <p className="text-gray-500 text-xs">Complete activities to start tracking your bonding journey</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="font-bold text-gray-800 text-sm mb-2">💡 Tips to Improve Bonding</div>
          <div className="space-y-2 text-xs text-gray-600">
            <p>• <strong>Be present:</strong> Put away phones during activity time</p>
            <p>• <strong>Follow their lead:</strong> Let your child direct the play</p>
            <p>• <strong>Name emotions:</strong> "You seem frustrated — that's okay"</p>
            <p>• <strong>Celebrate effort:</strong> "You tried so hard!" over "Good job"</p>
            <p>• <strong>Record joy:</strong> Note moments that made you both smile</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { buildWeeklyReport, type WeeklyReportData } from "../../lib/reports/weeklyReportData";

export function ReportScreen() {
  const { activeChild, activityLogs, addReportHistoryEntry } = useApp();
  const [generated, setGenerated] = useState(false);

  const report: WeeklyReportData | null = useMemo(() => {
    if (!activeChild) return null;
    return buildWeeklyReport(activeChild, activityLogs);
  }, [activeChild, activityLogs]);

  if (!activeChild || !report) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-gray-500">
        Select a child to generate their weekly report.
      </div>
    );
  }

  const handleGenerate = () => {
    addReportHistoryEntry({ weekStart: report.weekStart, weekEnd: report.weekEnd });
    setGenerated(true);
  };

  const coveragePercent = Math.round((report.coveredRegions / report.totalRegions) * 100);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold text-gray-900">Weekly Intelligence Report</h2>
        <p className="text-xs text-gray-500">
          {report.weekStart} — {report.weekEnd} for {report.childName}
        </p>
      </div>

      {!generated ? (
        <div className="text-center space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-sm text-gray-600 mb-4">
              Generate a comprehensive report covering {report.totalRegions} brain regions,
              intelligence scores, and personalized recommendations.
            </p>
            <button
              onClick={handleGenerate}
              className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm"
              style={{ background: "linear-gradient(135deg, #4361EE, #7209B7)" }}
            >
              Generate Report
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Activities" value={report.totalActivities} emoji="🎯" />
            <StatCard label="Minutes" value={report.totalMinutes} emoji="⏱️" />
            <StatCard label="Avg Rating" value={report.avgEngagement} emoji="⭐" />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Brain Region Coverage</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${coveragePercent}%`,
                    background: coveragePercent >= 70
                      ? "linear-gradient(90deg, #06D6A0, #4361EE)"
                      : coveragePercent >= 40
                        ? "linear-gradient(90deg, #FBBF24, #F59E0B)"
                        : "linear-gradient(90deg, #F87171, #EF4444)",
                  }}
                />
              </div>
              <span className="text-xs font-bold text-gray-600">
                {report.coveredRegions}/{report.totalRegions}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {report.regionCoverage.map(rc => (
                <div
                  key={rc.region}
                  className="text-center p-1.5 rounded-lg"
                  style={{
                    background: rc.activitiesCount > 0 ? "rgba(67,97,238,0.08)" : "rgba(0,0,0,0.02)",
                  }}
                >
                  <div className="text-[10px] font-medium text-gray-700 truncate">{rc.region}</div>
                  <div className="text-[10px] text-gray-400">{rc.activitiesCount} act</div>
                </div>
              ))}
            </div>
          </div>

          {report.topIntelligences.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Top Intelligences</h3>
              <div className="flex flex-wrap gap-1.5">
                {report.topIntelligences.map(i => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700">
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}

          {report.highlights.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Highlights</h3>
              {report.highlights.map((h, i) => (
                <p key={i} className="text-xs text-gray-600 mb-1">✨ {h}</p>
              ))}
            </div>
          )}

          {report.recommendations.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Recommendations</h3>
              {report.recommendations.map((r, i) => (
                <p key={i} className="text-xs text-gray-600 mb-1">💡 {r}</p>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-[10px] text-gray-400 mb-2">
              Level {report.level} · {report.brainPoints} Brain Points · {report.streakDays}-day streak
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: number; emoji: string }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm text-center">
      <div className="text-lg">{emoji}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

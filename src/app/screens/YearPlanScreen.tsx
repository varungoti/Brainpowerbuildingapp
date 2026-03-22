import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { getAgeTierConfig } from "../data/activities";
import { getExecutableYearPlan, getYearProgress, MONTH_NAMES, MONTH_NAMES_FULL, getCurrentMonth } from "../data/yearPlan";

export function YearPlanScreen() {
  const { activeChild, activityLogs } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showWeekly, setShowWeekly] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"roadmap" | "projections" | "research">("roadmap");

  if (!activeChild) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5 text-center gap-4"
        style={{ background: "#F0EFFF" }}>
        <div className="text-5xl">🗓️</div>
        <div className="text-gray-700 font-bold text-lg">Add a child profile to see the Year Plan</div>
      </div>
    );
  }

  const tier = activeChild.ageTier;
  const tierCfg = getAgeTierConfig(tier);
  const plan = getExecutableYearPlan(tier);
  const completedActivities = activityLogs.filter(l => l.childId === activeChild.id && l.completed).length;
  const progress = getYearProgress(completedActivities);
  const currentMonthPlan = plan.months.find(m => m.month === selectedMonth)!;
  const currentRealMonth = getCurrentMonth();

  const circumference = 2 * Math.PI * 54;
  const strokeDash = (progress.percent / 100) * circumference;

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F0EFFF" }}>

      {/* Hero Header */}
      <div className="relative overflow-hidden px-4 pt-4 pb-6 rounded-b-3xl mb-1"
        style={{ background: `linear-gradient(135deg,${tierCfg.color},#1a1a2e)` }}>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle,white,transparent)", transform: "translate(30%,-30%)" }} />

        <div className="text-white/70 text-xs mb-1">2026 Year Plan</div>
        <div className="text-white font-black text-lg mb-0.5">{activeChild.name}'s Year of Brilliance</div>
        <div className="text-white/60 text-xs mb-5">{tierCfg.label} · {plan.tagline}</div>

        {/* Progress arc */}
        <div className="flex items-center gap-5">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="absolute inset-0 -rotate-90" width="128" height="128" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
              <circle cx="64" cy="64" r="54" fill="none" stroke="white" strokeWidth="10"
                strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`}
                style={{ transition: "stroke-dasharray 1.5s ease", filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))" }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-white font-black" style={{ fontSize: 22 }}>{completedActivities}</div>
              <div className="text-white/50 text-center leading-tight" style={{ fontSize: 9 }}>of 300<br />activities</div>
            </div>
          </div>

          <div className="flex-1">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2 ${progress.onTrack ? "bg-emerald-500/20 border border-emerald-500/40" : "bg-amber-500/20 border border-amber-500/40"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${progress.onTrack ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className={`text-xs font-bold ${progress.onTrack ? "text-emerald-300" : "text-amber-300"}`}>
                {progress.onTrack ? "On Track ✓" : "Needs Boost"}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs">Year-end projection:</span>
                <span className="text-white font-bold text-xs">{progress.projectedYearEnd} activities</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs">Weekly target:</span>
                <span className="text-white font-bold text-xs">{progress.activitiesPerWeekNeeded}/week to reach 300</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-xs">Progress:</span>
                <span className="text-white font-bold text-xs">{progress.percent}% complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Year-End Vision */}
      <div className="mx-4 mb-4 rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#4361EE15,#7209B715)", border: "1px solid rgba(67,97,238,0.2)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🎯</span>
          <span className="font-bold text-gray-800 text-sm">By December 2026, {activeChild.name} will...</span>
        </div>
        <div className="text-gray-600 text-xs leading-relaxed">{plan.yearEndVision}</div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(0,0,0,0.06)" }}>
          {[
            { id: "roadmap", label: "📅 Roadmap" },
            { id: "projections", label: "📈 Outcomes" },
            { id: "research", label: "🔬 Science" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
              style={{
                background: activeTab === tab.id ? "white" : "transparent",
                color: activeTab === tab.id ? "#4361EE" : "#9CA3AF",
                boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "roadmap" && (
        <>
          {/* Month horizontal scroll */}
          <div className="mb-4">
            <div className="px-4 text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Monthly Journey</div>
            <div className="flex gap-2 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: "none" }}>
              {plan.months.map(m => {
                const isSelected = selectedMonth === m.month;
                const isCurrent = currentRealMonth === m.month;
                const isPast = m.month < currentRealMonth;
                return (
                  <button key={m.month} onClick={() => { setSelectedMonth(m.month); setShowWeekly(null); }}
                    className="flex-shrink-0 flex flex-col items-center gap-1 rounded-2xl transition-all"
                    style={{
                      width: 60, padding: "10px 4px",
                      background: isSelected ? m.color : isPast ? "rgba(0,0,0,0.04)" : "white",
                      border: `2px solid ${isSelected ? m.color : isCurrent ? m.color + "60" : "#e5e7eb"}`,
                      boxShadow: isSelected ? `0 4px 12px ${m.color}40` : "none",
                    }}>
                    <span style={{ fontSize: 18 }}>{m.emoji}</span>
                    <span className="font-bold text-center leading-tight"
                      style={{ fontSize: 10, color: isSelected ? "white" : "#374151" }}>
                      {MONTH_NAMES[m.month - 1]}
                    </span>
                    {isCurrent && !isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
                    )}
                    {isPast && !isSelected && (
                      <span style={{ fontSize: 10 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected month detail */}
          {currentMonthPlan && (
            <div className="mx-4 space-y-3 pb-6">
              {/* Month header card */}
              <div className="rounded-3xl overflow-hidden" style={{ background: `linear-gradient(135deg,${currentMonthPlan.color},${currentMonthPlan.color}99)`, boxShadow: `0 8px 24px ${currentMonthPlan.color}40` }}>
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-4xl">{currentMonthPlan.emoji}</div>
                    <div>
                      <div className="text-white font-black text-lg">{MONTH_NAMES_FULL[currentMonthPlan.month - 1]}</div>
                      <div className="text-white font-bold text-sm opacity-90">{currentMonthPlan.theme}</div>
                    </div>
                  </div>
                  <div className="text-white/80 text-xs leading-relaxed mb-4">{currentMonthPlan.description}</div>

                  <div className="flex items-center gap-2 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.15)" }}>
                    <span className="text-base">🔬</span>
                    <span className="text-white/90 text-xs leading-relaxed flex-1">{currentMonthPlan.scienceNote}</span>
                  </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-3 divide-x" style={{ background: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <div className="py-3 text-center">
                    <div className="text-white font-black text-base">{currentMonthPlan.weeklyTarget}×</div>
                    <div className="text-white/60" style={{ fontSize: 9 }}>Weekly Target</div>
                  </div>
                  <div className="py-3 text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.1)", borderRight: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="text-white font-black text-base">{currentMonthPlan.intelligenceFocus.length}</div>
                    <div className="text-white/60" style={{ fontSize: 9 }}>Intel. Types</div>
                  </div>
                  <div className="py-3 text-center">
                    <div className="text-white font-black text-base">{currentMonthPlan.milestones.length}</div>
                    <div className="text-white/60" style={{ fontSize: 9 }}>Milestones</div>
                  </div>
                </div>
              </div>

              {/* Intelligence focus */}
              <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #e5e7eb" }}>
                <div className="font-bold text-gray-800 text-sm mb-3">🧠 Intelligence Focus</div>
                <div className="flex flex-wrap gap-1.5">
                  {currentMonthPlan.intelligenceFocus.map(intel => (
                    <span key={intel} className="px-2.5 py-1 rounded-full text-white font-semibold"
                      style={{ fontSize: 11, background: currentMonthPlan.color }}>
                      {intel}
                    </span>
                  ))}
                </div>
                <div className="mt-3 p-2.5 rounded-xl" style={{ background: "#FFF9E6", border: "1px solid #FFE066" }}>
                  <div className="text-amber-700 text-xs font-semibold">📌 Research Highlight</div>
                  <div className="text-amber-600 text-xs mt-0.5">{currentMonthPlan.researchHighlight}</div>
                </div>
              </div>

              {/* Milestones */}
              <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #e5e7eb" }}>
                <div className="font-bold text-gray-800 text-sm mb-3">🏆 Month Milestones</div>
                <div className="space-y-2">
                  {currentMonthPlan.milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ background: "#F9FAFB" }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: currentMonthPlan.color + "20", border: `2px solid ${currentMonthPlan.color}50` }}>
                        <span style={{ fontSize: 10 }}>◎</span>
                      </div>
                      <span className="text-gray-700 text-xs leading-relaxed">{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly plans */}
              <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #e5e7eb" }}>
                <div className="font-bold text-gray-800 text-sm mb-3">📆 4-Week Breakdown</div>
                <div className="space-y-2">
                  {currentMonthPlan.weeklyPlans.map(wk => (
                    <div key={wk.week}>
                      <button onClick={() => setShowWeekly(showWeekly === wk.week ? null : wk.week)}
                        className="w-full flex items-center justify-between p-3 rounded-xl text-left"
                        style={{ background: showWeekly === wk.week ? currentMonthPlan.color + "12" : "#F9FAFB", border: `1px solid ${showWeekly === wk.week ? currentMonthPlan.color + "40" : "transparent"}` }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ fontSize: 10, background: currentMonthPlan.color }}>
                            {wk.week}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800" style={{ fontSize: 12 }}>Week {wk.week}</div>
                            <div className="text-gray-500" style={{ fontSize: 10 }}>
                              {wk.focus}
                              {wk.activityIds?.length ? ` · ${wk.activityIds.length} linked activities` : ""}
                            </div>
                          </div>
                        </div>
                        <span className="text-gray-400 text-sm">{showWeekly === wk.week ? "▲" : "▼"}</span>
                      </button>
                      {showWeekly === wk.week && (
                        <div className="ml-8 mt-1 space-y-1">
                          {wk.activities.map(act => (
                            <div key={act} className="flex items-center gap-2 py-1.5 px-3 rounded-xl"
                              style={{ background: currentMonthPlan.color + "08" }}>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentMonthPlan.color }} />
                              <span className="text-gray-700" style={{ fontSize: 11 }}>{act}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cultural method */}
              <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#4361EE10,#7209B710)", border: "1px solid rgba(67,97,238,0.15)" }}>
                <div className="font-bold text-gray-800 text-sm mb-1">🌍 Cultural Method This Month</div>
                <div className="text-gray-600 text-xs">{currentMonthPlan.culturalMethod}</div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "projections" && (
        <div className="px-4 pb-6 space-y-3">
          {/* 300-activity outcome */}
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)", boxShadow: "0 8px 24px rgba(67,97,238,0.3)" }}>
            <div className="text-white font-black text-sm mb-1">If {activeChild.name} completes 300 activities...</div>
            <div className="text-white/80 text-xs leading-relaxed">{plan.yearEndVision}</div>
          </div>

          {/* Stat chips */}
          <div className="grid grid-cols-2 gap-2">
            {plan.yearEndStats.map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-3 text-center" style={{ border: "1px solid #e5e7eb" }}>
                <div className="text-2xl mb-1">{stat.emoji}</div>
                <div className="font-black text-gray-900" style={{ fontSize: 16, color: stat.color }}>{stat.value}</div>
                <div className="text-gray-500" style={{ fontSize: 10 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Intelligence projections */}
          <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #e5e7eb" }}>
            <div className="font-bold text-gray-800 text-sm mb-4">Intelligence Outcomes at 300 Activities</div>
            <div className="space-y-3">
              {plan.projections.map(proj => (
                <div key={proj.intel}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span>{proj.emoji}</span>
                      <span className="font-semibold text-gray-800" style={{ fontSize: 12 }}>{proj.intel}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: proj.color }}>{proj.targetActivities} acts</span>
                  </div>
                  <div className="h-2 rounded-full mb-1.5" style={{ background: "#F3F4F6" }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.min(100, (completedActivities / proj.targetActivities) * 100)}%`, background: proj.color, transition: "width 1s ease" }} />
                  </div>
                  <div className="text-gray-500 leading-relaxed" style={{ fontSize: 10 }}>{proj.yearEndOutcome}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Projection graph simplified */}
          <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #e5e7eb" }}>
            <div className="font-bold text-gray-800 text-sm mb-3">Your Journey to 300</div>
            <div className="relative h-32">
              {/* Grid lines */}
              {[0, 100, 200, 300].map(n => (
                <div key={n} className="absolute w-full flex items-center" style={{ bottom: `${(n / 300) * 100}%` }}>
                  <span className="text-gray-300 absolute left-0" style={{ fontSize: 9 }}>{n}</span>
                  <div className="absolute left-5 right-0 h-px" style={{ background: "#F3F4F6" }} />
                </div>
              ))}
              {/* Completed bar */}
              <div className="absolute left-5 bottom-0 w-6 rounded-t-lg transition-all duration-1000"
                style={{ height: `${(completedActivities / 300) * 100}%`, background: "linear-gradient(to top,#4361EE,#7209B7)" }} />
              {/* Target line */}
              <div className="absolute left-5 right-0 border-t-2 border-dashed border-emerald-400" style={{ bottom: "100%" }}>
                <span className="absolute right-0 -top-3 text-emerald-500 font-bold" style={{ fontSize: 9 }}>300 Goal</span>
              </div>
              {/* Projected bar */}
              {progress.projectedYearEnd > completedActivities && (
                <div className="absolute left-14 bottom-0 w-6 rounded-t-lg"
                  style={{ height: `${(progress.projectedYearEnd / 300) * 100}%`, background: "rgba(67,97,238,0.2)", border: "2px dashed #4361EE" }} />
              )}
            </div>
            <div className="flex gap-3 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }} />
                <span className="text-gray-500" style={{ fontSize: 10 }}>Completed ({completedActivities})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-dashed border-blue-400" />
                <span className="text-gray-500" style={{ fontSize: 10 }}>Projected ({progress.projectedYearEnd})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "research" && (
        <div className="px-4 pb-6 space-y-3">
          <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#1a1a2e,#302b63)" }}>
            <div className="text-white font-black text-sm mb-1">🔬 The Science Behind This Plan</div>
            <div className="text-white/60 text-xs">Every activity and milestone is grounded in peer-reviewed research from Harvard, Johns Hopkins, Stanford, and global developmental science institutions.</div>
          </div>
          {plan.researchBacking.map((ref, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex items-start gap-3" style={{ border: "1px solid #e5e7eb" }}>
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold" style={{ fontSize: 11 }}>{i + 1}</span>
              </div>
              <span className="text-gray-700 text-xs leading-relaxed">{ref}</span>
            </div>
          ))}
          <div className="rounded-2xl p-4" style={{ background: "#EEF1FF", border: "1px solid rgba(67,97,238,0.2)" }}>
            <div className="font-bold text-blue-800 text-sm mb-2">📚 Key Research Institutions</div>
            {["Harvard Center on the Developing Child","Johns Hopkins School of Education","Stanford Learning Lab","UNICEF Child Development Research","WHO Early Childhood Development Program","National Institute of Child Health (USA)"].map(inst => (
              <div key={inst} className="flex items-center gap-2 mb-1">
                <span className="text-blue-500" style={{ fontSize: 10 }}>●</span>
                <span className="text-blue-700 text-xs">{inst}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
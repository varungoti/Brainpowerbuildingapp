import React from "react";
import { useApp, getLevelFromBP, getNextLevelBP, LEVEL_CONFIG, BADGE_DEFS } from "../context/AppContext";
import { getAgeTierConfig } from "../data/activities";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { OutcomeChecklistCard } from "../components/OutcomeChecklistCard";
import {
  BRAIN_REGIONS,
  getActiveBrainRegionCount,
  getBrainCoveragePercent,
  getSortedBrainRegionProgress,
} from "../data/brainRegions";

export function StatsScreen() {
  const { activeChild, activityLogs, outcomeChecklists, saveOutcomeChecklist } = useApp();
  if (!activeChild) return <EmptyState />;

  const childLogs = activityLogs.filter(l => l.childId === activeChild.id && l.completed);
  const lvl       = getLevelFromBP(activeChild.brainPoints);
  const nextBP    = getNextLevelBP(activeChild.brainPoints);
  const lvlPct    = lvl.level < LEVEL_CONFIG.length-1 ? Math.round(((activeChild.brainPoints - lvl.threshold) / (nextBP - lvl.threshold))*100) : 100;
  const tierCfg   = getAgeTierConfig(activeChild.ageTier);

  // Radar data
  const radarData = BRAIN_REGIONS.map((region) => ({
    intel: region.name.slice(0, 8),
    fullName: region.key,
    score: Math.min((activeChild.intelligenceScores[region.key] ?? 0) * 20, 100),
    fill: region.color,
  }));

  // By region
  const regionCount: Record<string,number> = {};
  childLogs.forEach(l => { regionCount[l.region] = (regionCount[l.region]??0)+1; });
  const regionData = Object.entries(regionCount).sort((a,b)=>b[1]-a[1]);

  // By week (last 7 days)
  const weekDays = Array.from({length:7},(_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i);
    return d.toDateString();
  });
  const weekCounts = weekDays.map(day => ({
    day: day.split(" ")[0],
    count: childLogs.filter(l => new Date(l.date).toDateString()===day).length,
  }));
  const maxWeek = Math.max(...weekCounts.map(w=>w.count), 1);

  // Intelligence bar data (sorted)
  const intelBars = getSortedBrainRegionProgress(activeChild.intelligenceScores).filter((item) => item.score > 0);
  const activeRegionCount = getActiveBrainRegionCount(activeChild.intelligenceScores);
  const coveragePct = getBrainCoveragePercent(activeChild.intelligenceScores);

  return (
    <div className="h-full overflow-y-auto" style={{ background:"#F0EFFF" }}>
      {/* Header */}
      <div className="rounded-b-3xl mb-4 px-4 pt-3 pb-5"
        style={{ background:"linear-gradient(135deg,#7209B7,#4361EE)" }}>
        <div className="text-white/70 text-xs mb-1">Development Profile</div>
        <div className="text-white font-black text-xl">{activeChild.name}'s Brain Stats</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-base">{tierCfg.emoji}</span>
          <span className="text-white/70 text-xs">{tierCfg.label} · {childLogs.length} activities completed</span>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-5">
        {/* Level card */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl animate-float"
              style={{ background:`${lvl.color}20`, border:`2px solid ${lvl.color}40` }}>
              {lvl.emoji}
            </div>
            <div>
              <div className="text-gray-500 text-xs">Current Level</div>
              <div className="text-gray-900 font-black text-lg">{lvl.name}</div>
              <div className="text-xs font-semibold" style={{ color:lvl.color }}>{activeChild.brainPoints.toLocaleString()} Brain Points ⚡</div>
            </div>
          </div>
          {lvl.level < LEVEL_CONFIG.length-1 && (
            <>
              <div className="flex justify-between text-gray-400 mb-1.5" style={{ fontSize:10 }}>
                <span>{activeChild.brainPoints} BP</span>
                <span>{lvlPct}% to {LEVEL_CONFIG[lvl.level+1].name} {LEVEL_CONFIG[lvl.level+1].emoji}</span>
                <span>{nextBP} BP</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                  style={{ width:`${lvlPct}%`, background:`linear-gradient(90deg,${lvl.color},${LEVEL_CONFIG[Math.min(lvl.level+1,5)].color})` }}>
                  <div className="absolute inset-0 animate-shimmer"/>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Streak + stats */}
        <div className="grid grid-cols-3 gap-2 animate-slide-up stagger-1">
          {[
            { icon:"🔥", val:`${activeChild.streak}`, label:"Day Streak", color:"#FB5607", bg:"#FFF4EF" },
            { icon:"✅", val:`${activeChild.totalActivities}`, label:"Completed", color:"#06D6A0", bg:"#EDFFF8" },
            { icon:"🏆", val:`${activeChild.badges.length}`, label:"Badges", color:"#FFB703", bg:"#FFFBEF" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center bg-white border border-gray-100">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-black text-gray-900" style={{ fontSize:20 }}>{s.val}</div>
              <div className="text-gray-400" style={{ fontSize:10 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-slide-up stagger-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-gray-800 text-sm">🧠 Brain Region Coverage</div>
              <div className="text-gray-500 text-xs mt-1">
                {activeRegionCount}/{BRAIN_REGIONS.length} mapped regions active across the full 15-region model.
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-900 font-black text-xl">{coveragePct}%</div>
              <div className="text-gray-400" style={{ fontSize: 10 }}>overall coverage</div>
            </div>
          </div>
          <div className="mt-3 h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${coveragePct}%`, background: "linear-gradient(90deg,#4361EE,#F72585,#06D6A0)" }}
            />
          </div>
          {intelBars.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {intelBars.slice(0, 5).map((item) => (
                <span
                  key={item.id}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: `${item.color}15`, color: item.color }}
                >
                  {item.emoji} {item.name} {item.percent}%
                </span>
              ))}
            </div>
          )}
        </div>

        <OutcomeChecklistCard
          childName={activeChild.name}
          months={outcomeChecklists[activeChild.id]}
          onSave={(answers) => saveOutcomeChecklist(activeChild.id, answers)}
        />

        {/* Intelligence Radar */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-slide-up stagger-3">
          <div className="font-bold text-gray-800 text-sm mb-3">🧠 Brain Radar (15 Regions)</div>
          {childLogs.length >= 2 ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top:8,right:16,bottom:8,left:16 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="intel" tick={{ fill:"#9CA3AF", fontSize:9 }} />
                <Tooltip formatter={(v: unknown, _n: unknown, p: { payload?: { fullName: string } }) => [`${Math.round((v as number) / 20)} activities`, p.payload?.fullName ?? ""]} />
                <Radar dataKey="score" stroke="#7209B7" fill="#7209B7" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-gray-400 text-xs">Complete at least 2 activities to see your radar chart</p>
            </div>
          )}
        </div>

        {/* Intelligence bars */}
        {intelBars.length > 0 && (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-slide-up stagger-4">
            <div className="font-bold text-gray-800 text-sm mb-3">📈 Activities by Brain Region</div>
            <div className="space-y-3">
              {intelBars.map((item, i) => (
                <div key={item.id} className={`animate-slide-left stagger-${Math.min(i+1,6)}`}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700 text-xs font-medium">{item.emoji} {item.key}</span>
                    <span className="text-gray-400 text-xs">{item.score} activities</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width:`${(item.score/intelBars[0].score)*100}%`, background:item.color }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7-day + 30-day combined panel */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-slide-up stagger-5">
          <div className="font-bold text-gray-800 text-sm mb-3">📅 This Week's Activity</div>
          <div className="flex items-end gap-1.5 h-16">
            {weekCounts.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-lg transition-all duration-700"
                  style={{ height:`${Math.max((w.count/maxWeek)*48, 4)}px`,
                    background:w.count>0?"linear-gradient(180deg,#4361EE,#7209B7)":"#e5e7eb" }}/>
                <span className="text-gray-400" style={{ fontSize:9 }}>{w.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 30-day heatmap */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-slide-up stagger-5">
          <div className="font-bold text-gray-800 text-sm mb-3">🔥 30-Day Heatmap</div>
          <div className="flex gap-0.5 flex-wrap">
            {Array.from({ length: 30 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (29 - i));
              const ds = d.toDateString();
              const count = childLogs.filter((l) => new Date(l.date).toDateString() === ds).length;
              const maxC = 1;
              const intensity = count === 0 ? 0 : Math.ceil((count / maxC) * 4);
              const bg = intensity === 0 ? "#F3F4F6" : intensity === 1 ? "#BBF7D0" : intensity === 2 ? "#4ADE80" : intensity === 3 ? "#16A34A" : "#064E3B";
              const isToday = d.toDateString() === new Date().toDateString();
              return (
                <div key={i} className="rounded-sm" style={{
                  width: "calc((100% - 29 * 2px) / 30)",
                  paddingBottom: "calc((100% - 29 * 2px) / 30)",
                  background: bg,
                  border: isToday ? "1px solid #4361EE" : "none",
                }} />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-2 justify-end">
            <span className="text-gray-400" style={{ fontSize: 9 }}>Less</span>
            {["#F3F4F6", "#BBF7D0", "#4ADE80", "#16A34A", "#064E3B"].map((c) => (
              <div key={c} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
            ))}
            <span className="text-gray-400" style={{ fontSize: 9 }}>More</span>
          </div>
        </div>

        {/* Cultural traditions */}
        {regionData.length > 0 && (
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-slide-up stagger-6">
            <div className="font-bold text-gray-800 text-sm mb-3">🌍 Cultural Traditions Explored</div>
            <div className="space-y-2">
              {regionData.map(([region, count]) => {
                const regionEmoji: Record<string,string> = { Indian:"🇮🇳", Chinese:"🇨🇳", Japanese:"🇯🇵", Korean:"🇰🇷", Western:"🌍" };
                const max = regionData[0][1];
                return (
                  <div key={region} className="flex items-center gap-2">
                    <span className="text-lg w-7">{regionEmoji[region]??"🌐"}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-gray-700 text-xs">{region}</span>
                        <span className="text-gray-400 text-xs">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                          style={{ width:`${(count/max)*100}%` }}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-slide-up stagger-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold text-gray-800 text-sm">🏆 Achievement Badges</div>
            <div className="text-gray-400 text-xs">{activeChild.badges.length}/{Object.keys(BADGE_DEFS).length} earned</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(BADGE_DEFS).map(([key, bd]) => {
              const earned = activeChild.badges.includes(key);
              return (
                <div key={key} className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${earned ? "animate-badge" : ""}`}
                  style={{ background: earned ? "#FFF9E6" : "#F5F5F5", border: `2px solid ${earned ? "#FFB703" : "#e5e7eb"}`, opacity: earned ? 1 : 0.4 }}>
                  <span className="text-2xl" style={{ filter: earned ? "none" : "grayscale(1)" }}>{bd.emoji}</span>
                  <span className="text-gray-700 text-center font-semibold leading-tight" style={{ fontSize: 9 }}>{bd.label}</span>
                  {earned && <span className="text-amber-500 font-bold" style={{ fontSize: 8 }}>✓ Earned</span>}
                  {!earned && <span className="text-gray-400" style={{ fontSize: 8 }}>{bd.desc.slice(0, 20)}…</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight box */}
        <div className="rounded-2xl p-4 animate-slide-up"
          style={{ background:"linear-gradient(135deg,#4361EE15,#7209B715)", border:"1px solid rgba(67,97,238,0.2)" }}>
          <div className="font-bold text-gray-800 text-sm mb-2">💡 Development Insight</div>
          <p className="text-gray-600 text-xs leading-relaxed">
            {childLogs.length === 0
              ? "Start generating activities to build your child's development profile across all 15 mapped brain regions."
              : `${activeChild.name} has exercised ${activeRegionCount} of ${BRAIN_REGIONS.length} mapped brain regions. `+
                (activeRegionCount < 8
                  ? "Try activities from underexplored areas to ensure holistic brain development."
                  : "Great holistic coverage! Keep diversifying across cultural traditions for maximum impact.")
            }
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const { navigate } = useApp();
  return (
    <div className="h-full flex flex-col items-center justify-center px-5 text-center gap-4" style={{ background:"#F0EFFF" }}>
      <div className="text-5xl animate-float">📊</div>
      <div className="text-gray-700 font-bold text-lg">No profile selected</div>
      <button onClick={() => navigate("home")} className="px-6 py-3 rounded-2xl text-white font-semibold"
        style={{ background:"linear-gradient(135deg,#4361EE,#7209B7)" }}>Go to Home</button>
    </div>
  );
}
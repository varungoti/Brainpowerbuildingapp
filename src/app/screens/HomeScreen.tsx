import { useApp, getLevelFromBP, getNextLevelBP, LEVEL_CONFIG, BADGE_DEFS } from "../context/AppContext";
import { SeasonalBanner } from "../../components/seasonal/SeasonalBanner";
import { INTEL_COLORS, ACTIVITIES, getAgeTierConfig } from "../data/activities";
import { getExecutableYearPlan, getExecutableYearPlanProgress, MONTH_NAMES_FULL, getCurrentMonth } from "../data/yearPlan";
import React, { useMemo, useState } from "react";
import brainBase from "../../assets/brain-progress-base.png";
import { BRAIN_REGIONS, getActiveBrainRegionCount } from "../data/brainRegions";
import { PredictorCard } from "../../components/milestones/PredictorCard";
import { predictMilestones } from "../../lib/milestones/milestonePredictor";
import { QuestBoard } from "../../components/gamification/QuestBoard";
import { TodaysFocusChip } from "../../components/competency/TodaysFocusChip";
import type { AIAgeCompetencyId } from "../../lib/competencies/aiAgeCompetencies";
import { AIHygieneTour } from "../../components/onboarding/AIHygieneTour";
import { OfflinePackButton } from "../../components/offline/OfflinePackButton";
import { CoverageTodayCard } from "../../components/coverage/CoverageTodayCard";

export function HomeScreen() {
  const { activeChild, children, setActiveChild, navigate, activityLogs, generatedPack, credits, hasCreditForToday, milestoneChecks, quests, setGeneratorIntent } = useApp();
  const [showChildPicker, setShowChildPicker] = useState(false);

  const handlePracticeFocus = (competencyIds: AIAgeCompetencyId[]) => {
    setGeneratorIntent({
      source: "ai_age_focus",
      title: "Today's AI-age focus",
      note: "Pack tilted toward your child's two priority dimensions.",
      priorityIntelligences: [],
      priorityCompetencies: competencyIds,
    });
    if (hasCreditForToday()) {
      navigate("generate");
    } else {
      navigate("paywall");
    }
  };

  if (!activeChild) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5 text-center gap-4">
        <div className="text-5xl animate-float">🧸</div>
        <div className="text-gray-700 font-bold text-lg">No child profile yet</div>
        <button onClick={() => navigate("add_child")}
          className="px-6 py-3 rounded-2xl text-white font-semibold"
          style={{ background:"linear-gradient(135deg,#4361EE,#7209B7)" }}>
          Add Child Profile
        </button>
      </div>
    );
  }

  const tierCfg = getAgeTierConfig(activeChild.ageTier);
  const lvlCfg  = getLevelFromBP(activeChild.brainPoints);
  const nextBP  = getNextLevelBP(activeChild.brainPoints);
  const progress = lvlCfg.level < LEVEL_CONFIG.length - 1
    ? ((activeChild.brainPoints - lvlCfg.threshold) / (nextBP - lvlCfg.threshold)) * 100
    : 100;
  const todayLogs = activityLogs.filter(l => l.childId === activeChild.id && new Date(l.date).toDateString() === new Date().toDateString());
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  // Missed day calculation
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const hadYesterdayActivity = activityLogs.some(
    l => l.childId === activeChild.id && new Date(l.date).toDateString() === yesterdayStr
  );
  const missedActivities = !hadYesterdayActivity
    ? ACTIVITIES.filter(a => a.ageTiers.includes(activeChild.ageTier)).slice(2, 5)
    : [];

  // Year progress
  const completedActivities = activityLogs.filter(l => l.childId === activeChild.id && l.completed).length;
  const completedActivityIds = activityLogs
    .filter((l) => l.childId === activeChild.id && l.completed)
    .map((l) => l.activityId);
  const yearProg = getExecutableYearPlanProgress(activeChild.ageTier, completedActivityIds);
  const currentMonthName = MONTH_NAMES_FULL[getCurrentMonth() - 1];
  const yearPlan = getExecutableYearPlan(activeChild.ageTier);
  const thisMonthPlan = yearPlan.months.find(m => m.month === getCurrentMonth());
  const activeBrainRegions = getActiveBrainRegionCount(activeChild.intelligenceScores);

  return (
    <div className="h-full overflow-y-auto" style={{ background:"#F0EFFF" }}>
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-b-3xl mb-4 pb-1"
        style={{ background:`linear-gradient(135deg,${tierCfg.color},${lvlCfg.color})` }}>
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full opacity-20"
          style={{ background:"rgba(255,255,255,0.3)", transform:"translate(30%,-30%)" }}/>
        <div className="absolute left-8 bottom-0 w-20 h-20 rounded-full opacity-15"
          style={{ background:"rgba(255,255,255,0.2)", transform:"translateY(40%)" }}/>

        <div className="relative px-4 pt-3 pb-5">
          {/* Child picker row */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setShowChildPicker(s => !s)}
              className="flex items-center gap-2 glass rounded-full px-3 py-1.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-base"
                style={{ background:`${activeChild.avatarColor}40` }}>{activeChild.avatarEmoji}</div>
              <span className="text-white text-xs font-semibold">{activeChild.name}</span>
              <span className="text-white/70 text-xs">{showChildPicker ? "▲" : "▼"}</span>
            </button>
            <button onClick={() => hasCreditForToday() ? navigate("generate") : navigate("paywall")}
              className="glass rounded-full px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1">
              <span>⚡</span> Generate
              {credits > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-white font-bold" style={{ fontSize:9, background:"rgba(255,183,3,0.4)" }}>{credits}d</span>}
            </button>
          </div>

          {/* Child picker dropdown */}
          {showChildPicker && children.length > 1 && (
            <div className="glass rounded-2xl p-2 mb-3 animate-slide-down">
              {children.map(c => (
                <button key={c.id} onClick={() => { setActiveChild(c.id); setShowChildPicker(false); }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-left transition-all"
                  style={{ background: c.id===activeChild.id?"rgba(255,255,255,0.2)":"transparent" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                    style={{ background:`${c.avatarColor}40` }}>{c.avatarEmoji}</div>
                  <div>
                    <div className="text-white text-xs font-semibold">{c.name}</div>
                    <div className="text-white/50" style={{ fontSize:10 }}>{getAgeTierConfig(c.ageTier).label}</div>
                  </div>
                  {c.id===activeChild.id && <span className="ml-auto text-white/80 text-xs">✓</span>}
                </button>
              ))}
              <button onClick={() => { navigate("add_child"); setShowChildPicker(false); }}
                className="w-full flex items-center gap-2 p-2 rounded-xl"
                style={{ background:"rgba(255,255,255,0.1)" }}>
                <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/40 flex items-center justify-center text-white/60">+</div>
                <span className="text-white/70 text-xs">Add another child</span>
              </button>
            </div>
          )}

          {/* Greeting + avatar */}
          <div className="flex items-end gap-4">
            <div>
              <div className="text-white/70 text-xs mb-0.5">{greeting} 👋</div>
              <div className="text-white font-black" style={{ fontSize:22 }}>{activeChild.name}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-base">{tierCfg.emoji}</span>
                <span className="text-white/80 text-xs">{tierCfg.label} · {tierCfg.desc}</span>
              </div>
            </div>
            <div className="ml-auto relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl animate-float"
                style={{ background:`${activeChild.avatarColor}40`, border:`2px solid ${activeChild.avatarColor}60` }}>
                {activeChild.avatarEmoji}
              </div>
              {activeChild.streak > 0 && (
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"
                  style={{ fontSize:10, color:"white", fontWeight:700 }}>
                  <span className="animate-flame">🔥</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-2 mt-4">
            <StatChip icon="⚡" value={activeChild.brainPoints.toLocaleString()} label="Brain Points" color="#FFB703"/>
            <StatChip icon="🔥" value={`${activeChild.streak}d`} label="Streak" color="#FB5607"/>
            <StatChip icon={lvlCfg.emoji} value={lvlCfg.name.split(" ")[0]} label="Level" color={lvlCfg.color}/>
          </div>

          {/* Level progress */}
          {lvlCfg.level < LEVEL_CONFIG.length - 1 && (
            <div className="mt-3">
              <div className="flex justify-between text-white/60 mb-1" style={{ fontSize:10 }}>
                <span>{lvlCfg.name}</span>
                <span>{activeChild.brainPoints} / {nextBP} BP → {LEVEL_CONFIG[lvlCfg.level+1].name}</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 animate-shimmer"
                  style={{ width:`${progress}%`, background:"linear-gradient(90deg,#FFB703,#FB5607)" }}/>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4 pb-6">

        {/* ── Today's AI-Age focus chip ────────────────────────────────── */}
        <TodaysFocusChip
          scores={activeChild.competencyScores}
          childName={activeChild.name}
          onPracticeNow={handlePracticeFocus}
        />

        {/* ── Family AI-Hygiene first-run + 30-day tour ────────────────── */}
        <AIHygieneTour totalActivities={activeChild.totalActivities} />

        {/* ── Missed Day Alert ─────────────────────────────────────────── */}
        {missedActivities.length > 0 && completedActivities > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(247,37,133,0.25)" }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ background:"rgba(247,37,133,0.1)" }}>
              <span>😔</span>
              <span className="font-bold text-pink-700 text-xs">Yesterday's brain session was missed</span>
            </div>
            <div className="p-3" style={{ background:"rgba(247,37,133,0.04)" }}>
              <div className="text-gray-500 text-xs mb-2">These opportunities were left on the table:</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {missedActivities.map(act => (
                  <div key={act.id} className="flex-shrink-0 flex items-center gap-2 p-2.5 rounded-xl opacity-70"
                    style={{ background:"white", border:"1px solid #e5e7eb", minWidth:140 }}>
                    <span className="text-xl">{act.emoji}</span>
                    <div>
                      <div className="text-gray-700 font-semibold" style={{ fontSize:10 }}>{act.name}</div>
                      <div className="text-gray-400" style={{ fontSize:9 }}>{act.intelligences[0]?.split("-")[0]}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => hasCreditForToday() ? navigate("generate") : navigate("paywall")}
                className="mt-2 w-full py-2 rounded-xl text-white font-bold text-xs"
                style={{ background:"linear-gradient(135deg,#F72585,#7209B7)" }}>
                Make it up today → Generate Now
              </button>
            </div>
          </div>
        )}

        {/* ── Year Plan Progress Widget ──────────────────────────────── */}
        <button onClick={() => navigate("year_plan")}
          className="w-full rounded-2xl p-4 text-left"
          style={{ background:"white", border:"1px solid #e5e7eb", boxShadow:"0 10px 28px rgba(67,97,238,0.08)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                style={{ background:"#EEF1FF" }}>🗓️</div>
              <div>
                <div className="font-bold text-gray-800 text-sm">{yearProg.planYear} Year Plan</div>
                <div className="text-gray-400" style={{ fontSize:10 }}>Curriculum-linked journey · {currentMonthName}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-black text-gray-900" style={{ fontSize:18 }}>{yearProg.curriculumCoverage}%</div>
              <div className="text-gray-400" style={{ fontSize:9 }}>coverage</div>
            </div>
          </div>
          <div className="mb-3 rounded-2xl overflow-hidden" style={{ background:"linear-gradient(135deg,#EEF1FF,#F7F3FF)", border:"1px solid rgba(67,97,238,0.08)" }}>
            <div className="flex items-center gap-3 p-3">
              <div className="relative w-24 h-20 flex-shrink-0 rounded-2xl overflow-hidden" style={{ background:"radial-gradient(circle at 30% 30%,rgba(67,97,238,0.18),transparent 55%), #121938" }}>
                <img
                  src={brainBase}
                  alt="Colorful brain development progress"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <div className="absolute inset-x-2 bottom-2 h-1.5 rounded-full overflow-hidden bg-black/20">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width:`${yearProg.curriculumCoverage}%`, background:"linear-gradient(90deg,#F72585,#4361EE,#06D6A0)" }}
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-gray-800 text-xs">Brain Development Journey</div>
                <div className="text-gray-500 leading-relaxed mt-0.5" style={{ fontSize:10 }}>
                  The roadmap now tracks linked curriculum coverage, not just raw activity count.
                </div>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="px-2 py-1 rounded-full font-bold text-gray-700" style={{ fontSize:9, background:"#FFFFFF" }}>
                    {yearProg.completedLinkedActivities}/{yearProg.totalLinkedActivities} linked activities
                  </span>
                  {thisMonthPlan && (
                    <span className="px-2 py-1 rounded-full font-bold" style={{ fontSize:9, background:thisMonthPlan.color + "15", color:thisMonthPlan.color }}>
                      {thisMonthPlan.emoji} {thisMonthPlan.theme}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width:`${yearProg.curriculumCoverage}%`, background:"linear-gradient(90deg,#4361EE,#7209B7)" }}/>
          </div>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${yearProg.onTrack ? "bg-emerald-100" : "bg-amber-100"}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${yearProg.onTrack ? "bg-emerald-500" : "bg-amber-500"}`}/>
              <span className={`font-bold ${yearProg.onTrack ? "text-emerald-700" : "text-amber-700"}`} style={{ fontSize:10 }}>
                {yearProg.onTrack ? "On Track" : `Need ${yearProg.activitiesPerWeekNeeded}/week`}
              </span>
            </div>
            {thisMonthPlan && (
              <div className="flex items-center gap-1">
                <span className="text-sm">{thisMonthPlan.emoji}</span>
                <span className="text-gray-500" style={{ fontSize:10 }}>{thisMonthPlan.theme}</span>
              </div>
            )}
            <span className="text-blue-500 font-semibold" style={{ fontSize:10 }}>View Plan →</span>
          </div>
        </button>

        {/* ── AI Counselor CTA ───────────────────────────────────────── */}
        <button onClick={() => navigate("ai_counselor")}
          className="w-full rounded-2xl p-4 text-left relative overflow-hidden"
          style={{ background:"linear-gradient(135deg,#0f0f1a,#302b63)", border:"1px solid rgba(67,97,238,0.3)" }}>
          <div className="absolute right-0 top-0 w-24 h-24 rounded-full opacity-20"
            style={{ background:"radial-gradient(circle,#F72585,transparent)", transform:"translate(30%,-30%)" }}/>
          <div className="flex items-center gap-3 relative">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background:"rgba(67,97,238,0.3)", border:"1px solid rgba(67,97,238,0.4)" }}>
              🧠
            </div>
            <div className="flex-1">
              <div className="text-white font-black text-sm">NeuroSpark AI Counselor</div>
              <div className="text-white/60 text-xs">Behavioral, eating & learning concerns</div>
              <div className="text-white/40 text-xs">25+ research citations · 3 solutions</div>
            </div>
            <span className="text-white/40 text-lg">›</span>
          </div>
        </button>

        {/* ── Credit status ─────────────────────────────────────────── */}
        {credits === 0 && (
          <button onClick={() => navigate("paywall")}
            className="w-full rounded-3xl overflow-hidden relative animate-pop-in"
            style={{ background:"linear-gradient(135deg,#4361EE,#7209B7)", boxShadow:"0 8px 24px rgba(67,97,238,0.3)" }}>
            <div className="absolute inset-0 animate-shimmer opacity-50"/>
            <div className="relative p-5 text-center">
              <div className="text-4xl mb-2 animate-brain-pulse">⚡</div>
              <div className="text-white font-black text-base mb-1">Generate Today's Activities</div>
              <div className="text-white/70 text-xs mb-2">₹100/day · AGE Algorithm · {tierCfg.label}</div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-xs"
                style={{ background:"rgba(255,255,255,0.15)" }}>
                🔓 Unlock Pack → ₹100
              </div>
            </div>
          </button>
        )}

        {credits > 0 && !generatedPack && (
          <button onClick={() => navigate("generate")}
            className="w-full rounded-3xl overflow-hidden relative animate-pop-in"
            style={{ background:"linear-gradient(135deg,#06D6A0,#4361EE)", boxShadow:"0 8px 24px rgba(6,214,160,0.3)" }}>
            <div className="relative p-5 text-center">
              <div className="text-4xl mb-2">⚡</div>
              <div className="text-white font-black text-base mb-1">Generate Today's Pack</div>
              <div className="text-white/80 text-xs">{credits} day{credits > 1 ? "s" : ""} remaining · AGE Algorithm</div>
            </div>
          </button>
        )}

        {/* Today's activities */}
        {generatedPack && generatedPack.length > 0 && (
          <div>
            <SectionTitle title="Today's Activities" action={todayLogs.length === 0 ? undefined : { label:"View All", fn:() => navigate("history") }}/>
            <div className="space-y-2">
              {generatedPack.slice(0,3).map((act, i) => {
                const done = todayLogs.some(l => l.activityId === act.id && l.completed);
                return (
                  <button key={act.id} onClick={() => navigate("generate")}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all animate-slide-up stagger-${i+1}`}
                    style={{ background: done ? "rgba(6,214,160,0.08)" : "white", border:`1px solid ${done?"rgba(6,214,160,0.3)":"#e5e7eb"}` }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: done ? "rgba(6,214,160,0.15)" : "#F5F0FF" }}>
                      {done ? "✅" : act.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 text-sm truncate" style={{ textDecoration:done?"line-through":"none", opacity:done?0.6:1 }}>{act.name}</div>
                      <div className="flex gap-1 mt-1">
                        {act.intelligences.slice(0,2).map(intel => (
                          <span key={intel} className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background:(INTEL_COLORS[intel]??"#888")+"18", color:INTEL_COLORS[intel]??"#888" }}>
                            {intel.split("-")[0]}
                          </span>
                        ))}
                        <span className="text-xs text-gray-400">{act.regionEmoji} {act.duration}m</span>
                      </div>
                    </div>
                    <span className="text-gray-300">›</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Badges */}
        {activeChild.badges.length > 0 && (
          <div>
            <SectionTitle title="Achievements" action={{ label:"All →", fn:() => navigate("stats") }}/>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activeChild.badges.map((b, i) => {
                const bd = BADGE_DEFS[b];
                return bd ? (
                  <div key={b} className={`flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl animate-badge stagger-${i+1}`}
                    style={{ background:"white", border:"1px solid #e5e7eb", minWidth:72 }}>
                    <span className="text-2xl">{bd.emoji}</span>
                    <span className="text-gray-700 text-center leading-tight" style={{ fontSize:9, fontWeight:600 }}>{bd.label}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* ── Mini Brain Map Widget ─────────────────────────────────── */}
        <button onClick={() => navigate("brain_map")}
          className="w-full rounded-2xl overflow-hidden text-left relative"
          style={{ background:"linear-gradient(135deg,#080816,#12122a)", border:"1px solid rgba(67,97,238,0.25)" }}>
          <div className="absolute right-0 top-0 w-28 h-28 rounded-full opacity-15"
            style={{ background:"radial-gradient(circle,#4361EE,transparent)", transform:"translate(30%,-30%)" }}/>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white font-black text-sm">🧠 Brain Development Map</div>
                <div className="text-white/40 text-xs">
                  {activeBrainRegions}/{BRAIN_REGIONS.length} regions active
                </div>
              </div>
              <span className="text-white/30 text-lg">›</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {BRAIN_REGIONS.map((region) => {
                const score = activeChild.intelligenceScores[region.key] ?? 0;
                return (
                  <div key={region.id} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ fontSize:14,
                    background: score > 0 ? `${region.color}30` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${score > 0 ? region.color + "50" : "rgba(255,255,255,0.05)"}`,
                    filter: score > 0 ? "none" : "grayscale(1) opacity(0.3)" }}>
                    {region.emoji}
                  </div>
                );
              })}
            </div>
          </div>
        </button>

        {/* External coverage credited today (Survivor 7) */}
        <CoverageTodayCard childId={activeChild.id} />

        {/* Seasonal banner */}
        <SeasonalBanner onExplore={() => navigate("seasonal_library")} />

        {/* Milestone Predictor */}
        <MilestonePredictorWidget
          child={activeChild}
          logs={activityLogs}
          checkedMilestones={milestoneChecks[activeChild.id] ?? []}
          onViewAll={() => navigate("milestones")}
        />

        {/* Active Quests */}
        {quests.length > 0 && (
          <div>
            <SectionTitle title="Active Quests" action={{ label: "All →", fn: () => navigate("quests") }} />
            <QuestBoard quests={quests.slice(0, 3)} />
          </div>
        )}

        {/* Offline pack download for school-run / no-internet use */}
        <OfflinePackButton pack={generatedPack ?? []} childId={activeChild.id} />

        {/* Quick actions */}
        <div>
          <SectionTitle title="Quick Actions" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { emoji:"⚡", label:"New Activity Pack",  color:"#4361EE", bg:"#EEF1FF", fn:() => hasCreditForToday() ? navigate("generate") : navigate("paywall") },
              { emoji:"🎧", label:"Audio mode (screen-free)", color:"#3A0CA3", bg:"#EEF0FF", fn:() => navigate("audio_mode") },
              { emoji:"💞", label:"Rupture & repair (90s)", color:"#F72585", bg:"#FFF0F6", fn:() => navigate("rupture_repair") },
              { emoji:"😴", label:"Sleep × cognition", color:"#0EA5E9", bg:"#EFF8FF", fn:() => navigate("sleep_log") },
              { emoji:"🗓️", label:"Year Roadmap",       color:"#7209B7", bg:"#F5F0FF", fn:() => navigate("year_plan") },
              { emoji:"🧠", label:"AI Counselor",       color:"#F72585", bg:"#FFF0F6", fn:() => navigate("ai_counselor") },
              { emoji:"📊", label:"Stats & check-in", color:"#06D6A0", bg:"#EDFFF8", fn:() => navigate("stats") },
              { emoji:"📅", label:"Activity History",   color:"#FFB703", bg:"#FFFBE6", fn:() => navigate("history") },
              { emoji:"📰", label:"Community feeds",    color:"#4361EE", bg:"#EEF1FF", fn:() => navigate("feeds") },
              { emoji:"👤", label:"Profile & Settings", color:"#FB5607", bg:"#FFF4EF", fn:() => navigate("profile") },
            ].map((a, i) => (
              <button key={a.label} onClick={a.fn}
                className={`flex items-center gap-2.5 p-3.5 rounded-2xl text-left active:scale-95 transition-transform animate-slide-up stagger-${i+1}`}
                style={{ background:"white", border:"1px solid #e5e7eb" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:a.bg }}>
                  {a.emoji}
                </div>
                <span className="text-gray-800 font-semibold" style={{ fontSize:12 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Today summary */}
        {todayLogs.length > 0 && (
          <div className="rounded-2xl p-4 animate-slide-up" style={{ background:"linear-gradient(135deg,#06D6A020,#4361EE10)", border:"1px solid rgba(6,214,160,0.3)" }}>
            <div className="text-sm font-bold text-gray-800 mb-1">✅ Today's Progress</div>
            <div className="text-xs text-gray-600">{todayLogs.filter(l=>l.completed).length} activities completed · +{todayLogs.reduce((s,l)=>s+l.brainPointsEarned,0)} Brain Points earned</div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatChip({ icon, value, label, color }: { icon:string; value:string; label:string; color:string }) {
  return (
    <div className="flex-1 glass-dark rounded-2xl px-2.5 py-2 text-center border-t-2"
      style={{ borderTopColor: color }}>
      <div className="text-base mb-0.5">{icon}</div>
      <div className="text-white font-black" style={{ fontSize:14 }}>{value}</div>
      <div className="text-white/50" style={{ fontSize:9 }}>{label}</div>
    </div>
  );
}

function SectionTitle({ title, action }: { title:string; action?:{ label:string; fn:()=>void } }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <span className="text-gray-800 font-bold text-sm">{title}</span>
      {action && <button onClick={action.fn} className="text-xs font-semibold" style={{ color:"#4361EE" }}>{action.label}</button>}
    </div>
  );
}

function MilestonePredictorWidget({ child, logs, checkedMilestones, onViewAll }: {
  child: import("../context/AppContext").ChildProfile;
  logs: import("../context/AppContext").ActivityLog[];
  checkedMilestones: string[];
  onViewAll: () => void;
}) {
  const predictions = useMemo(
    () => predictMilestones(child, logs, checkedMilestones),
    [child, logs, checkedMilestones],
  );
  if (predictions.length === 0) return null;
  return <PredictorCard predictions={predictions} onViewAll={onViewAll} />;
}
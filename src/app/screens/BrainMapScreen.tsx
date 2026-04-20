import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp, KYCData } from "../context/AppContext";
import { getAgeTierConfig } from "../data/activities";
import { getExecutableYearPlan, getExecutableYearPlanProgress, MONTH_NAMES_FULL, getCurrentMonth } from "../data/yearPlan";
import {
  playBrainPulse,
  playClick, playActivityComplete,
} from "../utils/audioEffects";
import { BrainInteractive } from "@/components/brain/BrainInteractive";
import { BrainLegend } from "@/components/brain/BrainLegend";
import {
  BRAIN_REGIONS,
  MAX_BRAIN_REGION_SCORE,
  getActiveBrainRegionCount,
  getBrainCoveragePercent,
  getSortedBrainRegionProgress,
  getTopBrainRegions,
} from "../data/brainRegions";
import { generateInsights } from "@/lib/brainInsights";
import { CompetencyRadar } from "@/components/competency/CompetencyRadar";
import { CompetencyDetailModal } from "@/components/competency/CompetencyDetailModal";
import { AI_AGE_COMPETENCIES, getCompetencyPercent, type AIAgeCompetencyId } from "@/lib/competencies/aiAgeCompetencies";
import { PredictorCard } from "@/components/milestones/PredictorCard";
import { predictMilestones } from "@/lib/milestones/milestonePredictor";
import { WeeklyNarrative } from "@/components/narrative/WeeklyNarrative";
import { captureProductEvent } from "../../utils/productAnalytics";

// ─── Stats Row (persistent across all tabs) ──────────────────────────────────
function StatsRow({ scores }: { scores: Record<string, number> }) {
  const overallPct = getBrainCoveragePercent(scores);
  const activeCount = getActiveBrainRegionCount(scores);
  const topThree = getTopBrainRegions(scores, 3);
  const circ = 2 * Math.PI * 28;
  const dash = (overallPct / 100) * circ;

  return (
    <div className="mx-4 -mt-5 relative z-10 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-md border border-slate-100">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg className="absolute inset-0 -rotate-90" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#E2E8F0" strokeWidth="5" />
          <motion.circle cx="32" cy="32" r="28" fill="none" stroke="url(#coverageGrad)" strokeWidth="5"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${circ}` }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="coverageGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4361EE" />
              <stop offset="100%" stopColor="#7209B7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-sm text-slate-900">{Math.round(overallPct)}%</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-slate-500 text-[10px] font-medium uppercase tracking-wide">Neural Coverage</div>
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span className="font-black text-lg text-slate-900">{activeCount}</span>
          <span className="text-slate-400 text-xs">/ {BRAIN_REGIONS.length} regions active</span>
        </div>
      </div>

      {topThree.length > 0 && (
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-slate-400 text-[9px] font-semibold uppercase tracking-wider">Top</span>
          <div className="flex items-center gap-0.5">
            {topThree.map(r => (
              <div key={r.id} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: `${r.color}20` }} title={r.key}>
                {r.emoji}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Bar (pill segmented control) ────────────────────────────────────────
type BrainTab = "brain" | "radar" | "ai_age" | "plan" | "kyc";

const TABS: { id: BrainTab; emoji: string; label: string }[] = [
  { id: "brain",  emoji: "🧠", label: "Brain" },
  { id: "radar",  emoji: "📊", label: "Radar" },
  { id: "ai_age", emoji: "🤖", label: "AI-Age" },
  { id: "plan",   emoji: "🗓️", label: "Year" },
  { id: "kyc",    emoji: "🧒", label: "Profile" },
];

function SegmentedTabs({ tab, setTab }: { tab: BrainTab; setTab: (t: BrainTab) => void }) {
  return (
    <div className="mx-4 mt-3 mb-1 flex rounded-2xl bg-slate-100/80 p-0.5 relative">
      {TABS.map(t => (
        <button key={t.id} onClick={() => { setTab(t.id); playClick(); }}
          className="relative z-10 flex-1 flex items-center justify-center gap-1 py-2 rounded-xl transition-colors min-w-0"
        >
          <span style={{ fontSize: 12 }}>{t.emoji}</span>
          <span className={`font-semibold text-[10px] truncate ${tab === t.id ? "text-slate-900" : "text-slate-400"}`}>
            {t.label}
          </span>
          {tab === t.id && (
            <motion.div
              layoutId="brainTabPill"
              className="absolute inset-0 rounded-xl bg-white shadow-sm"
              style={{ zIndex: -1 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Brain Tab ───────────────────────────────────────────────────────────────
function BrainTabContent({ scores, navigate }: { scores: Record<string, number>; navigate: (v: string) => void }) {
  const { activeChild, activityLogs, milestoneChecks } = useApp();
  const sorted = getSortedBrainRegionProgress(scores);
  const insights = generateInsights(scores);

  const predictions = React.useMemo(() => {
    if (!activeChild) return [];
    const childLogs = activityLogs.filter(l => l.childId === activeChild.id);
    const checked = milestoneChecks[activeChild.id] ?? [];
    return predictMilestones(activeChild, childLogs, checked);
  }, [activeChild, activityLogs, milestoneChecks]);

  useEffect(() => {
    const t = setTimeout(() => playBrainPulse(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      <div className="px-3 pt-2">
        <BrainInteractive scores={scores} />
      </div>

      <div className="px-4 pt-1 pb-0.5">
        <p className="text-center text-slate-400 text-[10px]">
          Colors unlock as your child practices · Tap any region for details
        </p>
      </div>

      <div className="mt-2 pl-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2 pr-4 pb-2">
          {sorted.map(r => (
            <div key={r.id}
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 flex-shrink-0 bg-white"
              style={{ borderColor: r.score > 0 ? `${r.color}60` : "#e2e8f0" }}
            >
              <span className="text-xs">{r.emoji}</span>
              <span className="text-[10px] font-semibold text-slate-700">{r.name}</span>
              <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
                style={{ background: r.score > 0 ? `${r.color}20` : "#f1f5f9", color: r.score > 0 ? r.color : "#94a3b8" }}>
                {r.percent}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <BrainLegend scores={scores} />

      <div className="px-4 mt-2 space-y-2.5">
        {insights.map(insight => (
          <div key={`${insight.type}-${insight.regionId}`}
            className="flex gap-3 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm">
            <div className="w-1 rounded-full flex-shrink-0"
              style={{ background: insight.type === "strength" ? "#06D6A0" : "#F59E0B" }} />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                {insight.type === "strength" ? "Strength" : "Opportunity"}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{insight.text}</p>
            </div>
          </div>
        ))}
      </div>

      {predictions.length > 0 && (
        <div className="px-4 mt-3">
          <PredictorCard
            predictions={predictions}
            onViewAll={() => navigate("milestones")}
          />
        </div>
      )}

      <div className="px-4 mt-3">
        <WeeklyNarrative
          childName={activeChild?.name ?? ""}
          narrative={null}
          isLoading={false}
          isPremium={false}
          onGenerate={() => navigate("report")}
        />
      </div>

      <div className="px-4 mt-3 mb-5 grid grid-cols-2 gap-2">
        {([
          { emoji: "📊", label: "Radar View",  color: "#4361EE", action: () => {} },
          { emoji: "🗓️", label: "Year Plan",   color: "#7209B7", action: () => navigate("year_plan") },
          { emoji: "📋", label: "Milestones",  color: "#FFB703", action: () => navigate("milestones") },
          { emoji: "⚡", label: "Generate",    color: "#F72585", action: () => navigate("generate") },
        ] as const).map(card => (
          <button key={card.label} onClick={card.action}
            className="flex items-center gap-2 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm text-left transition-all active:scale-[0.97]">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
              style={{ background: `${card.color}15` }}>
              {card.emoji}
            </div>
            <span className="text-xs font-semibold text-slate-700">{card.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── AI-Age Readiness Tab ────────────────────────────────────────────────────
function AIAgeReadinessTab({ scores }: { scores?: Record<string, number> }) {
  const [selected, setSelected] = React.useState<AIAgeCompetencyId | null>(null);

  React.useEffect(() => {
    captureProductEvent("competency_radar_view", {});
  }, []);

  const ranked = AI_AGE_COMPETENCIES.map((c) => ({ id: c.id, pct: getCompetencyPercent(scores?.[c.id] ?? 0) })).sort(
    (a, b) => a.pct - b.pct,
  );
  const weakest = ranked.slice(0, 2).map((r) => r.id);
  const strongest = ranked.slice(-2).map((r) => r.id);

  return (
    <div className="flex-1 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: "none" }}>
      <div className="text-slate-400 text-xs text-center pt-2 pb-1 font-medium">12-Dimension AI-Age Readiness</div>

      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-2">
        <CompetencyRadar
          scores={scores}
          onSelect={(competency) => {
            setSelected(competency.id);
            captureProductEvent("competency_detail_view", { competency_id: competency.id, surface: "radar" });
          }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 px-1">
        <div className="rounded-2xl bg-white border border-slate-100 p-3">
          <div className="text-[10px] uppercase tracking-wide font-bold text-amber-600 mb-1.5">⚠️ Today's focus</div>
          <div className="space-y-1">
            {weakest.map((id) => {
              const c = AI_AGE_COMPETENCIES.find((x) => x.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setSelected(id);
                    captureProductEvent("competency_detail_view", { competency_id: id, surface: "weakest_card" });
                  }}
                  className="w-full flex items-center gap-1.5 text-left"
                >
                  <span className="text-sm">{c.emoji}</span>
                  <span className="text-[11px] font-semibold text-slate-700 truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 p-3">
          <div className="text-[10px] uppercase tracking-wide font-bold text-emerald-600 mb-1.5">✓ Strongest</div>
          <div className="space-y-1">
            {strongest.map((id) => {
              const c = AI_AGE_COMPETENCIES.find((x) => x.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setSelected(id);
                    captureProductEvent("competency_detail_view", { competency_id: id, surface: "strongest_card" });
                  }}
                  className="w-full flex items-center gap-1.5 text-left"
                >
                  <span className="text-sm">{c.emoji}</span>
                  <span className="text-[11px] font-semibold text-slate-700 truncate">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 px-1">
        <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500 mb-2">All 12 Dimensions</div>
        <div className="space-y-1.5">
          {AI_AGE_COMPETENCIES.map((c) => {
            const score = scores?.[c.id] ?? 0;
            const pct = getCompetencyPercent(score);
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelected(c.id);
                  captureProductEvent("competency_detail_view", { competency_id: c.id, surface: "list" });
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm text-left active:scale-[0.99] transition"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: `${c.color}20` }}>
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-800 text-xs font-semibold truncate">{c.label}</div>
                  <div className="h-1.5 rounded-full mt-0.5 bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: c.color }} />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-black text-xs" style={{ color: pct > 0 ? c.color : "#CBD5E1" }}>
                    {Math.round(pct)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 mx-1 rounded-2xl border-2 border-dashed border-slate-200 p-3">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">🛡️ Anti-overclaim guarantee</div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          We never promise that one app will make your child "AI-ready". These dimensions are a parent compass —
          tap any tile to see the research it's grounded in.
        </p>
      </div>

      {selected && (
        <CompetencyDetailModal
          competency={AI_AGE_COMPETENCIES.find((c) => c.id === selected) ?? null}
          score={scores?.[selected] ?? 0}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ─── Radar Tab ───────────────────────────────────────────────────────────────
function RadarTab({ scores }: { scores: Record<string, number> }) {
  const categories = BRAIN_REGIONS.map(r => ({ key: r.key, name: r.name, emoji: r.emoji, color: r.color }));
  const n = categories.length;
  const cx = 160, cy = 150, maxR = 110;
  const angleStep = (2 * Math.PI) / n;

  const points = categories.map((cat, i) => {
    const score = scores[cat.key] ?? 0;
    const pct = Math.min(1, score / MAX_BRAIN_REGION_SCORE);
    const angle = -Math.PI / 2 + i * angleStep;
    return {
      x: cx + Math.cos(angle) * maxR * pct,
      y: cy + Math.sin(angle) * maxR * pct,
      lx: cx + Math.cos(angle) * (maxR + 14),
      ly: cy + Math.sin(angle) * (maxR + 14),
      ...cat, pct, score,
    };
  });

  const polyPoints = points.map(p => `${p.x},${p.y}`).join(" ");
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex-1 overflow-y-auto px-2 pb-4" style={{ scrollbarWidth: "none" }}>
      <div className="text-slate-400 text-xs text-center pt-2 pb-1 font-medium">Overall Development Radar</div>
      <div className="rounded-2xl bg-white mx-2 border border-slate-100 shadow-sm">
        <svg viewBox="0 0 320 300" className="w-full" style={{ maxHeight: 280 }}>
          {rings.map(r => (
            <polygon key={r}
              points={categories.map((_, i) => {
                const angle = -Math.PI / 2 + i * angleStep;
                return `${cx + Math.cos(angle) * maxR * r},${cy + Math.sin(angle) * maxR * r}`;
              }).join(" ")}
              fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
          ))}
          {categories.map((_, i) => {
            const angle = -Math.PI / 2 + i * angleStep;
            return (
              <line key={i}
                x1={cx} y1={cy}
                x2={cx + Math.cos(angle) * maxR}
                y2={cy + Math.sin(angle) * maxR}
                stroke="#E2E8F0" strokeWidth="0.5" />
            );
          })}
          <polygon points={polyPoints} fill="rgba(79,70,229,0.12)" stroke="#4F46E5" strokeWidth="1.5" />
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={3} fill={p.color} stroke="white" strokeWidth={1} />
              <text x={p.lx} y={p.ly + 1} textAnchor="middle" fill="#94A3B8" fontSize="6">
                {p.emoji}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="px-2 space-y-1.5 mt-3">
        {[...BRAIN_REGIONS].sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0)).map(reg => {
          const score = scores[reg.key] ?? 0;
          const pct = Math.min(100, (score / MAX_BRAIN_REGION_SCORE) * 100);
          return (
            <div key={reg.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${reg.color}20` }}>{reg.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-700 text-xs font-semibold" style={{ fontSize: 10 }}>{reg.key}</div>
                <div className="h-1.5 rounded-full mt-0.5 bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: reg.color }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-xs" style={{ color: pct > 0 ? reg.color : "#CBD5E1" }}>{score}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Know Your Child Tab ─────────────────────────────────────────────────────
const DEFAULT_KYC: Omit<KYCData, "updatedAt"> = {
  curiosity: 7, energy: 7, patience: 5, creativity: 7, social: 6,
  learningStyle: null, energyLevel: 2, adaptability: 2, mood: 2, sensitivity: 2,
  notes: "",
};
const TEMP_DIMS: { key: keyof Pick<KYCData, "energyLevel"|"adaptability"|"mood"|"sensitivity">; label: string; emoji: string; opts: [string,string,string] }[] = [
  { key:"energyLevel",  label:"Energy Level",  emoji:"⚡", opts:["Gentle","Moderate","Energetic"] },
  { key:"adaptability", label:"Adaptability",  emoji:"🔄", opts:["Slow",   "Moderate","Quick"    ] },
  { key:"mood",         label:"Baseline Mood", emoji:"😊", opts:["Serious","Mixed",   "Cheerful" ] },
  { key:"sensitivity",  label:"Sensitivity",   emoji:"🌡️", opts:["Low",    "Medium",  "High"     ] },
];
const TRAITS: { key: keyof Pick<KYCData,"curiosity"|"energy"|"patience"|"creativity"|"social">; label: string; emoji: string; color: string }[] = [
  { key:"curiosity",   label:"Curiosity",          emoji:"🔍", color:"#4361EE" },
  { key:"energy",      label:"Energy",             emoji:"⚡", color:"#FB5607" },
  { key:"patience",    label:"Patience",           emoji:"🕐", color:"#06D6A0" },
  { key:"creativity",  label:"Creativity",         emoji:"🎨", color:"#7209B7" },
  { key:"social",      label:"Social Connection",  emoji:"🤝", color:"#F72585" },
];
const LEARNING_STYLES = [
  { id:"visual" as const,     emoji:"👁️",  label:"Visual",     desc:"Learns by seeing — pictures, diagrams, colour-coding",      color:"#4361EE" },
  { id:"auditory" as const,   emoji:"👂",  label:"Auditory",   desc:"Learns by listening — songs, stories, verbal instruction",   color:"#7209B7" },
  { id:"kinesthetic" as const,emoji:"🤸", label:"Kinesthetic", desc:"Learns by doing — touch, movement, hands-on activities",    color:"#06D6A0" },
];

function KnowYourChildTab() {
  const { activeChild, kycData, saveKYCData } = useApp();
  const saved = activeChild ? (kycData[activeChild.id] ?? null) : null;
  const [form, setForm] = useState<Omit<KYCData,"updatedAt">>(saved ? { ...saved } : { ...DEFAULT_KYC });
  const [saved_, setSaved_] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!activeChild) return;
    saveKYCData(activeChild.id, form);
    setSaved_(true);
    playActivityComplete();
    setTimeout(() => setSaved_(false), 2500);
  };

  if (!activeChild) return (
    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No child selected</div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4" style={{ scrollbarWidth: "none" }}>
      <div className="pt-3 pb-1">
        <div className="text-slate-900 font-black text-base">Know Your Child</div>
        <div className="text-slate-400 text-xs">Help the AI understand {activeChild.name}'s unique personality</div>
      </div>

      <KycSection title="Core Strengths" emoji="💪">
        <div className="space-y-4">
          {TRAITS.map(t => (
            <div key={t.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-600 text-xs font-semibold">{t.emoji} {t.label}</span>
                <span className="font-black text-sm" style={{ color: t.color }}>{form[t.key]}/10</span>
              </div>
              <div className="relative h-7 flex items-center">
                <div className="absolute inset-x-0 h-2 rounded-full bg-slate-200" />
                <div className="absolute left-0 h-2 rounded-full transition-all"
                  style={{ width: `${(form[t.key] as number / 10) * 100}%`, background: `linear-gradient(90deg,${t.color}80,${t.color})` }} />
                <input type="range" min={1} max={10} value={form[t.key] as number}
                  onChange={e => set(t.key, +e.target.value as any)}
                  className="absolute inset-x-0 w-full opacity-0 h-7 cursor-pointer" />
                <div className="absolute h-5 w-5 rounded-full border-2 border-white shadow-lg transition-all"
                  style={{ left: `calc(${((form[t.key] as number - 1) / 9) * 100}% - 10px)`, background: t.color }} />
              </div>
            </div>
          ))}
        </div>
      </KycSection>

      <KycSection title="Learning Style" emoji="🎯">
        <div className="space-y-2">
          {LEARNING_STYLES.map(ls => {
            const active = form.learningStyle === ls.id;
            return (
              <button key={ls.id} onClick={() => set("learningStyle", ls.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{
                  background: active ? `${ls.color}10` : "#F8FAFC",
                  border: `1px solid ${active ? ls.color : "#E2E8F0"}`,
                }}>
                <span className="text-xl">{ls.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-800 font-semibold text-xs">{ls.label} Learner</div>
                  <div className="text-slate-400 text-xs">{ls.desc}</div>
                </div>
                {active && <span className="text-emerald-500 text-sm font-bold">✓</span>}
              </button>
            );
          })}
        </div>
      </KycSection>

      <KycSection title="Temperament" emoji="🧬">
        <div className="space-y-3">
          {TEMP_DIMS.map(dim => (
            <div key={dim.key}>
              <div className="text-slate-500 text-xs mb-1.5">{dim.emoji} {dim.label}</div>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map(v => {
                  const active = (form[dim.key] as number) === v;
                  return (
                    <button key={v} onClick={() => set(dim.key, v)}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: active ? "#4361EE" : "#F1F5F9",
                        color: active ? "white" : "#64748B",
                        border: `1px solid ${active ? "#4361EE" : "#E2E8F0"}`,
                      }}>
                      {dim.opts[v - 1]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </KycSection>

      <KycSection title="Parent Observations" emoji="📝">
        <textarea
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder={`What have you noticed about ${activeChild.name}'s learning, behavior, or personality?`}
          rows={4}
          className="w-full px-3 py-3 rounded-xl text-slate-800 text-xs resize-none outline-none bg-slate-50 border border-slate-200 placeholder:text-slate-300"
        />
      </KycSection>

      <motion.button
        onClick={handleSave}
        whileTap={{ scale: 0.97 }}
        className="w-full py-3.5 rounded-2xl font-bold text-white text-sm relative overflow-hidden"
        style={{ background: saved_ ? "linear-gradient(135deg,#06D6A0,#2DC653)" : "linear-gradient(135deg,#4361EE,#7209B7)" }}>
        {saved_ ? "✓ Saved! Activities will now be personalised" : `Save ${activeChild.name}'s Profile`}
      </motion.button>
    </div>
  );
}

function KycSection({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-base">{emoji}</span>
        <span className="text-slate-800 font-bold text-xs">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Year Plan Mini Tab ──────────────────────────────────────────────────────
function YearPlanTab() {
  const { activeChild, activityLogs, navigate } = useApp();
  if (!activeChild) return <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No child selected</div>;
  const completedActivityIds = activityLogs
    .filter((l) => l.childId === activeChild.id && l.completed)
    .map((l) => l.activityId);
  const progress  = getExecutableYearPlanProgress(activeChild.ageTier, completedActivityIds);
  const plan      = getExecutableYearPlan(activeChild.ageTier);
  const curMonth  = getCurrentMonth();
  const monthPlan = plan.months.find(m => m.month === curMonth)!;
  const circ      = 2 * Math.PI * 56;
  const dash      = (progress.curriculumCoverage / 100) * circ;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center gap-5 py-5">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="absolute inset-0 -rotate-90" width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="56" fill="none" stroke="#E2E8F0" strokeWidth="10" />
            <motion.circle cx="64" cy="64" r="56" fill="none" stroke="#4361EE" strokeWidth="10"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${dash} ${circ}` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ filter: "drop-shadow(0 0 6px rgba(67,97,238,0.4))" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-slate-900 font-black" style={{ fontSize: 24 }}>{progress.curriculumCoverage}%</div>
            <div className="text-slate-400 text-center leading-tight" style={{ fontSize: 9 }}>curriculum<br/>coverage</div>
          </div>
        </div>
        <div>
          <div className="text-slate-900 font-black text-base mb-1">{activeChild.name}'s {progress.planYear} Plan</div>
          <div className="text-slate-500 text-xs mb-2">{plan.tagline}</div>
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${progress.onTrack ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
            {progress.onTrack ? "✅ On Track" : `⚡ Need ${progress.activitiesPerWeekNeeded}/week`}
          </div>
        </div>
      </div>

      {monthPlan && (
        <div className="rounded-2xl bg-white p-4 mb-3 border border-slate-100 shadow-sm overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: monthPlan.color }} />
          <div className="flex items-center gap-2 mb-2 pl-2">
            <span className="text-xl">{monthPlan.emoji}</span>
            <div>
              <div className="text-slate-900 font-bold text-sm">{MONTH_NAMES_FULL[curMonth - 1]} Focus</div>
              <div className="text-slate-400 text-xs">{monthPlan.theme}</div>
            </div>
          </div>
          <div className="text-slate-500 text-xs leading-relaxed mb-3 pl-2">{monthPlan.description}</div>
          <div className="text-slate-400 text-xs italic pl-2">{monthPlan.scienceNote}</div>
        </div>
      )}

      {monthPlan && (
        <div className="rounded-2xl bg-white p-4 mb-3 border border-slate-100 shadow-sm">
          <div className="text-slate-500 font-semibold text-xs mb-2.5">🎯 {MONTH_NAMES_FULL[curMonth - 1]} Milestones</div>
          <div className="space-y-1.5">
            {monthPlan.milestones.map((m: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-slate-300 text-xs mt-0.5">◦</span>
                <span className="text-slate-600 text-xs">{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => navigate("year_plan")}
        className="w-full py-3 rounded-2xl font-bold text-white text-sm"
        style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>
        View Full Year Roadmap →
      </button>
    </div>
  );
}

// ─── Main Brain Map Screen ───────────────────────────────────────────────────
export function BrainMapScreen() {
  const { activeChild, navigate, activityLogs } = useApp();
  const [tab, setTab] = useState<BrainTab>("brain");

  const scores = activeChild?.intelligenceScores ?? {};
  const tierCfg = activeChild ? getAgeTierConfig(activeChild.ageTier) : null;
  const completedCount = activityLogs.filter(l => l.childId === activeChild?.id && l.completed).length;

  if (!activeChild) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5 text-center gap-4"
        style={{ background: "#F0EFFF" }}>
        <div className="text-5xl animate-float">🧠</div>
        <div className="text-slate-800 font-bold text-base">No child profile yet</div>
        <div className="text-slate-400 text-xs">Add a child to start mapping their brain development</div>
        <button onClick={() => navigate("add_child")}
          className="px-6 py-3 rounded-2xl text-white font-semibold text-sm"
          style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>
          Add Child Profile
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "#F0EFFF" }}>
      <div className="flex-shrink-0 rounded-b-3xl pb-6 relative"
        style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>
        <div className="absolute right-0 top-0 w-40 h-40 rounded-full opacity-15"
          style={{ background: "rgba(255,255,255,0.3)", transform: "translate(30%,-30%)" }} />
        <div className="absolute left-8 bottom-0 w-24 h-24 rounded-full opacity-10"
          style={{ background: "rgba(255,255,255,0.2)", transform: "translateY(40%)" }} />

        <div className="relative px-4 pt-3 pb-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/60 text-xs">Brain Development Map</div>
              <div className="text-white font-black text-lg leading-tight">{activeChild.name}'s Neural Network</div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass">
                <span>{tierCfg?.emoji}</span>
                <span className="text-xs font-bold text-white/90">{tierCfg?.label}</span>
              </div>
              <div className="text-white/40 text-right" style={{ fontSize: 9 }}>{completedCount} activities done</div>
            </div>
          </div>
        </div>
      </div>

      <StatsRow scores={scores} />
      <SegmentedTabs tab={tab} setTab={setTab} />

      <AnimatePresence mode="wait">
        <motion.div key={tab} className="flex-1 flex flex-col overflow-hidden"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}>
          {tab === "brain"  && <BrainTabContent scores={scores} navigate={navigate as (v: string) => void} />}
          {tab === "radar"  && <RadarTab scores={scores} />}
          {tab === "ai_age" && <AIAgeReadinessTab scores={activeChild.competencyScores} />}
          {tab === "plan"   && <YearPlanTab />}
          {tab === "kyc"    && <KnowYourChildTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

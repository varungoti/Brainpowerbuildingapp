import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp, KYCData } from "../context/AppContext";
import { getAgeTierConfig } from "../data/activities";
import { getYearPlan, getYearProgress, MONTH_NAMES_FULL, getCurrentMonth } from "../data/yearPlan";
import {
  playBrainPulse,
  playClick, playActivityComplete,
} from "../utils/audioEffects";
import { AnatomicalBrain } from "../components/AnatomicalBrain";

// ─── 15 Brain Region Definitions (13 original + Pronunciation + Coordination)
const BRAIN_REGIONS = [
  // TOP CENTER — Prefrontal
  { id:"executive", key:"Executive Function", name:"Executive", emoji:"🧩",
    cx:200, cy:72, r:22, color:"#4361EE",
    lobe:"Prefrontal Cortex",
    desc:"Planning, decision-making & impulse control — the brain's CEO. Powers focus, goal-setting and self-regulation.",
    connTo:[1,2,3,5,13] },

  // UPPER LEFT
  { id:"linguistic", key:"Linguistic", name:"Language", emoji:"🗣️",
    cx:112, cy:100, r:20, color:"#F72585",
    lobe:"Left Frontal (Broca's Area)",
    desc:"Reading, writing, storytelling and language acquisition. Broca's & Wernicke's areas both activated.",
    connTo:[0,6,13] },

  // UPPER RIGHT
  { id:"creative", key:"Creative", name:"Creative", emoji:"🎨",
    cx:288, cy:100, r:20, color:"#7209B7",
    lobe:"Right Frontal Lobe",
    desc:"Imagination, artistic thinking, divergent problem-solving. Right hemisphere speciality.",
    connTo:[0,4,14] },

  // MID LEFT
  { id:"logical", key:"Logical-Mathematical", name:"Logical", emoji:"🔢",
    cx:78, cy:158, r:19, color:"#3A0CA3",
    lobe:"Left Parietal Lobe",
    desc:"Number sense, pattern recognition, scientific reasoning and abstract logic.",
    connTo:[0,4,8] },

  // MID RIGHT
  { id:"spatial", key:"Spatial-Visual", name:"Spatial", emoji:"🎯",
    cx:322, cy:158, r:19, color:"#480CA8",
    lobe:"Right Parietal Lobe",
    desc:"Mental rotation, navigation, design thinking. Crucial for STEM and visual arts.",
    connTo:[2,3,14] },

  // CENTER — Emotional (Limbic)
  { id:"emotional", key:"Emotional", name:"Emotional", emoji:"❤️",
    cx:200, cy:148, r:22, color:"#E63946",
    lobe:"Limbic System (Amygdala)",
    desc:"Emotional intelligence, empathy, self-awareness. Foundation of mental wellbeing.",
    connTo:[0,7,9] },

  // LOWER LEFT
  { id:"musical", key:"Musical-Rhythmic", name:"Musical", emoji:"🎵",
    cx:100, cy:220, r:18, color:"#FB5607",
    lobe:"Left Temporal (Auditory Cortex)",
    desc:"Rhythm, melody, beat & pitch. Strengthens mathematical reasoning and language.",
    connTo:[1,8,13] },

  // LOWER RIGHT
  { id:"social", key:"Interpersonal", name:"Social", emoji:"🤝",
    cx:300, cy:220, r:18, color:"#06D6A0",
    lobe:"Right Temporal Lobe",
    desc:"Reading social cues, cooperation, leadership and communication. Mirror neuron network.",
    connTo:[5,10] },

  // BOTTOM LEFT
  { id:"bodily", key:"Bodily-Kinesthetic", name:"Bodily", emoji:"🏃",
    cx:72, cy:285, r:18, color:"#2DC653",
    lobe:"Motor Cortex & Cerebellum",
    desc:"Motor skills, body awareness, physical intelligence and gross motor coordination.",
    connTo:[6,11,14] },

  // BOTTOM CENTER
  { id:"intrapersonal", key:"Intrapersonal", name:"Self", emoji:"🧘",
    cx:200, cy:260, r:18, color:"#118AB2",
    lobe:"Default Mode Network",
    desc:"Self-knowledge, mindfulness, reflective thinking and metacognition.",
    connTo:[5,11,12] },

  // BOTTOM RIGHT
  { id:"naturalist", key:"Naturalist", name:"Nature", emoji:"🌿",
    cx:328, cy:285, r:18, color:"#06D6A0",
    lobe:"Right Cerebellum",
    desc:"Pattern recognition in nature, categorisation, ecological thinking.",
    connTo:[7,12] },

  // FAR BOTTOM LEFT
  { id:"existential", key:"Existential", name:"Wonder", emoji:"✨",
    cx:140, cy:320, r:16, color:"#6A4C93",
    lobe:"Left Occipital",
    desc:"Deep questioning, wonder, philosophy and meaning-making. Uniquely human.",
    connTo:[8,9] },

  // FAR BOTTOM RIGHT
  { id:"digital", key:"Digital-Technological", name:"Digital", emoji:"💻",
    cx:260, cy:320, r:16, color:"#4CC9F0",
    lobe:"Right Occipital",
    desc:"Computational thinking, systems understanding and tech-native pattern recognition.",
    connTo:[9,10] },

  // NEW: PRONUNCIATION — between Linguistic and Musical
  { id:"pronunciation", key:"Pronunciation", name:"Speech", emoji:"👅",
    cx:55, cy:180, r:17, color:"#FF6B9D",
    lobe:"Broca's & Wernicke's Areas",
    desc:"Articulation, phonological awareness, speech clarity. Controls tongue/mouth motor planning for clear speech.",
    connTo:[1,6,3] },

  // NEW: COORDINATION — between Bodily and Spatial
  { id:"coordination", key:"Coordination", name:"Coordination", emoji:"🤹",
    cx:340, cy:228, r:17, color:"#FFD166",
    lobe:"Cerebellum & Basal Ganglia",
    desc:"Hand-eye coordination, finger dexterity, muscle reflex timing, bilateral integration.",
    connTo:[4,8,7,2] },
] as const;

const MAX_SCORE = 20;

// ─── 3D Cartoonish Brain Visualization ────────────────────────────────────────
function BrainMapViz({ scores }: { scores: Record<string, number> }) {
  const totalScore = Object.values(scores).reduce((s, v) => s + v, 0);
  const maxTotal = BRAIN_REGIONS.length * MAX_SCORE;
  const overallPct = Math.min(100, (totalScore / maxTotal) * 100);
  const activeCount = Object.keys(scores).filter(k => (scores[k] ?? 0) > 0).length;

  useEffect(() => {
    const t = setTimeout(() => playBrainPulse(), 300);
    return () => clearTimeout(t);
  }, []);

  // Compute top 3 strengths
  const sorted = [...BRAIN_REGIONS].sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0));
  const topThree = sorted.slice(0, 3).filter(r => (scores[r.key] ?? 0) > 0);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto" style={{ scrollbarWidth: "none" }}>
      {/* Overall progress bar */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/50 text-xs">Neural Coverage</span>
          <span className="text-white/80 text-xs font-bold">{Math.round(overallPct)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden relative">
          <motion.div className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ background: "linear-gradient(90deg,#4361EE,#F72585,#FFB703)" }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-white/30" style={{ fontSize: 9 }}>
            {activeCount}/15 regions active
          </span>
          {topThree.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-white/25" style={{ fontSize: 8 }}>Top:</span>
              {topThree.map(r => (
                <span key={r.id} title={r.key}>{r.emoji}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Anatomical Brain Visualization */}
      <div className="px-2 py-1">
        <AnatomicalBrain scores={scores} />
      </div>

      {/* Legend hint */}
      <div className="px-4 pb-3">
        <div className="text-center text-white/25" style={{ fontSize: 8 }}>
          Tap any brain region to see details · Colors fill as activities are completed
        </div>
      </div>
    </div>
  );
}

// ─── Spider / Radar Chart ─────────────────────────────────────────────────────
function RadarTab({ scores }: { scores: Record<string, number> }) {
  const categories = BRAIN_REGIONS.map(r => ({ key: r.key, name: r.name, emoji: r.emoji, color: r.color }));
  const n = categories.length;
  const cx = 160, cy = 150, maxR = 110;
  const angleStep = (2 * Math.PI) / n;

  const points = categories.map((cat, i) => {
    const score = scores[cat.key] ?? 0;
    const pct = Math.min(1, score / MAX_SCORE);
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

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex-1 overflow-y-auto px-2 pb-4" style={{ scrollbarWidth: "none" }}>
      <div className="text-white/40 text-xs text-center pt-2 pb-1">Overall Development Radar</div>
      <svg viewBox="0 0 320 300" className="w-full" style={{ maxHeight: 280 }}>
        {/* Grid */}
        {rings.map(r => (
          <polygon key={r}
            points={categories.map((_, i) => {
              const angle = -Math.PI / 2 + i * angleStep;
              return `${cx + Math.cos(angle) * maxR * r},${cy + Math.sin(angle) * maxR * r}`;
            }).join(" ")}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        ))}
        {/* Axes */}
        {categories.map((_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          return (
            <line key={i}
              x1={cx} y1={cy}
              x2={cx + Math.cos(angle) * maxR}
              y2={cy + Math.sin(angle) * maxR}
              stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          );
        })}
        {/* Data polygon */}
        <polygon points={polyPoints} fill="rgba(67,97,238,0.15)" stroke="#4361EE" strokeWidth="1.5" />
        {/* Data points + labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill={p.color} stroke="white" strokeWidth={1} />
            <text x={p.lx} y={p.ly + 1} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="6">
              {p.emoji}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend list */}
      <div className="px-2 space-y-1.5 mt-1">
        {[...BRAIN_REGIONS].sort((a, b) => (scores[b.key] ?? 0) - (scores[a.key] ?? 0)).map(reg => {
          const score = scores[reg.key] ?? 0;
          const pct = Math.min(100, (score / MAX_SCORE) * 100);
          return (
            <div key={reg.id} className="flex items-center gap-2.5 p-2 rounded-xl"
              style={{ background: pct > 0 ? `${reg.color}10` : "rgba(255,255,255,0.02)", border: `1px solid ${pct > 0 ? reg.color + "25" : "rgba(255,255,255,0.04)"}` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: `${reg.color}20` }}>{reg.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-semibold" style={{ fontSize: 10 }}>{reg.key}</div>
                <div className="h-1 rounded-full mt-0.5 bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: reg.color }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-black text-xs" style={{ color: reg.color }}>{score}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Know Your Child Tab ──────────────────────────────────────────────────────
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
  { id:"visual" as const,     emoji:"👁️",  label:"Visual",     desc:"Learns by seeing — pictures, diagrams, colour-coding" },
  { id:"auditory" as const,   emoji:"👂",  label:"Auditory",   desc:"Learns by listening — songs, stories, verbal instruction" },
  { id:"kinesthetic" as const,emoji:"🤸", label:"Kinesthetic", desc:"Learns by doing — touch, movement, hands-on activities" },
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
    <div className="flex-1 flex items-center justify-center text-white/40 text-sm">No child selected</div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5" style={{ scrollbarWidth: "none" }}>
      <div className="pt-3 pb-1">
        <div className="text-white font-black text-base">Know Your Child</div>
        <div className="text-white/40 text-xs">Help the AI understand {activeChild.name}'s unique personality</div>
      </div>

      <Section title="Core Strengths" emoji="💪">
        <div className="space-y-4">
          {TRAITS.map(t => (
            <div key={t.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/80 text-xs font-semibold">{t.emoji} {t.label}</span>
                <span className="font-black text-sm" style={{ color: t.color }}>{form[t.key]}/10</span>
              </div>
              <div className="relative h-7 flex items-center">
                <div className="absolute inset-x-0 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div className="absolute left-0 h-2 rounded-full transition-all"
                  style={{ width: `${(form[t.key] as number / 10) * 100}%`, background: `linear-gradient(90deg,${t.color}80,${t.color})` }} />
                <input type="range" min={1} max={10} value={form[t.key] as number}
                  onChange={e => set(t.key, +e.target.value as any)}
                  className="absolute inset-x-0 w-full opacity-0 h-7" style={{ cursor: "pointer" }} />
                <div className="absolute h-5 w-5 rounded-full border-2 border-white shadow-lg transition-all"
                  style={{ left: `calc(${((form[t.key] as number - 1) / 9) * 100}% - 10px)`, background: t.color }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Learning Style" emoji="🎯">
        <div className="space-y-2">
          {LEARNING_STYLES.map(ls => (
            <button key={ls.id} onClick={() => set("learningStyle", ls.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
              style={{
                background: form.learningStyle === ls.id ? `${ls.id === "visual" ? "#4361EE" : ls.id === "auditory" ? "#7209B7" : "#06D6A0"}25` : "rgba(255,255,255,0.05)",
                border: `1px solid ${form.learningStyle === ls.id ? (ls.id === "visual" ? "#4361EE" : ls.id === "auditory" ? "#7209B7" : "#06D6A0") : "rgba(255,255,255,0.1)"}`,
              }}>
              <span className="text-xl">{ls.emoji}</span>
              <div>
                <div className="text-white font-semibold text-xs">{ls.label} Learner</div>
                <div className="text-white/45 text-xs">{ls.desc}</div>
              </div>
              {form.learningStyle === ls.id && <span className="ml-auto text-green-400 text-sm">✓</span>}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Temperament" emoji="🧬">
        <div className="space-y-3">
          {TEMP_DIMS.map(dim => (
            <div key={dim.key}>
              <div className="text-white/60 text-xs mb-1.5">{dim.emoji} {dim.label}</div>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map(v => (
                  <button key={v} onClick={() => set(dim.key, v)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: (form[dim.key] as number) === v ? "#4361EE" : "rgba(255,255,255,0.07)",
                      color: (form[dim.key] as number) === v ? "white" : "rgba(255,255,255,0.5)",
                      border: `1px solid ${(form[dim.key] as number) === v ? "#4361EE" : "rgba(255,255,255,0.1)"}`,
                    }}>
                    {dim.opts[v - 1]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Parent Observations" emoji="📝">
        <textarea
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder={`What have you noticed about ${activeChild.name}'s learning, behavior, or personality?`}
          rows={4}
          className="w-full px-3 py-3 rounded-xl text-white text-xs resize-none outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", caretColor: "white" }}
        />
      </Section>

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

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-base">{emoji}</span>
        <span className="text-white font-bold text-xs">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Year Plan Mini Tab ───────────────────────────────────────────────────────
function YearPlanTab() {
  const { activeChild, activityLogs, navigate } = useApp();
  if (!activeChild) return <div className="flex-1 flex items-center justify-center text-white/40 text-sm">No child selected</div>;
  const completed = activityLogs.filter(l => l.childId === activeChild.id && l.completed).length;
  const progress  = getYearProgress(completed);
  const plan      = getYearPlan(activeChild.ageTier);
  const curMonth  = getCurrentMonth();
  const monthPlan = plan.months.find(m => m.month === curMonth)!;
  const circ      = 2 * Math.PI * 56;
  const dash      = (progress.percent / 100) * circ;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center gap-5 py-5">
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="absolute inset-0 -rotate-90" width="128" height="128" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <motion.circle cx="64" cy="64" r="56" fill="none" stroke="white" strokeWidth="10"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${dash} ${circ}` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-white font-black" style={{ fontSize: 24 }}>{completed}</div>
            <div className="text-white/40 text-center leading-tight" style={{ fontSize: 9 }}>of 300<br/>done</div>
          </div>
        </div>
        <div>
          <div className="text-white font-black text-base mb-1">{activeChild.name}'s 2026 Plan</div>
          <div className="text-white/50 text-xs mb-2">{plan.tagline}</div>
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${progress.onTrack ? "bg-emerald-900/50 text-emerald-300" : "bg-amber-900/50 text-amber-300"}`}>
            {progress.onTrack ? "✅ On Track" : `⚡ Need ${progress.activitiesPerWeekNeeded}/week`}
          </div>
        </div>
      </div>
      {monthPlan && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: `${monthPlan.color}15`, border: `1px solid ${monthPlan.color}30` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{monthPlan.emoji}</span>
            <div>
              <div className="text-white font-bold text-sm">{MONTH_NAMES_FULL[curMonth - 1]} Focus</div>
              <div className="text-white/50 text-xs">{monthPlan.theme}</div>
            </div>
          </div>
          <div className="text-white/65 text-xs leading-relaxed mb-3">{monthPlan.description}</div>
          <div className="text-white/40 text-xs italic">{monthPlan.scienceNote}</div>
        </div>
      )}
      {monthPlan && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-white/60 font-semibold text-xs mb-2.5">🎯 {MONTH_NAMES_FULL[curMonth - 1]} Milestones</div>
          <div className="space-y-1.5">
            {monthPlan.milestones.map((m: string, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-white/25 text-xs mt-0.5">◦</span>
                <span className="text-white/65 text-xs">{m}</span>
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

// ─── Main Brain Map Screen ────────────────────────────────────────────────────
type BrainTab = "brain" | "radar" | "plan" | "kyc";

export function BrainMapScreen() {
  const { activeChild, navigate, activityLogs } = useApp();
  const [tab, setTab] = useState<BrainTab>("brain");

  const scores = activeChild?.intelligenceScores ?? {};
  const tierCfg = activeChild ? getAgeTierConfig(activeChild.ageTier) : null;
  const completedCount = activityLogs.filter(l => l.childId === activeChild?.id && l.completed).length;

  const TABS: { id: BrainTab; emoji: string; label: string }[] = [
    { id: "brain",  emoji: "🧠", label: "Brain" },
    { id: "radar",  emoji: "📊", label: "Radar" },
    { id: "plan",   emoji: "🗓️", label: "Year" },
    { id: "kyc",    emoji: "🧒", label: "Know" },
  ];

  if (!activeChild) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5 text-center gap-4"
        style={{ background: "linear-gradient(160deg,#0f0f1a,#1a1a2e)" }}>
        <div className="text-5xl">🧠</div>
        <div className="text-white font-bold text-base">No child profile yet</div>
        <button onClick={() => navigate("add_child")}
          className="px-6 py-3 rounded-2xl text-white font-semibold text-sm"
          style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>
          Add Child Profile
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "linear-gradient(160deg,#080816,#12122a)" }}>

      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2"
        style={{ background: "linear-gradient(180deg,rgba(67,97,238,0.15),transparent)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/50 text-xs">Brain Development Map</div>
            <div className="text-white font-black text-lg leading-tight">{activeChild.name}'s Neural Network</div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
              style={{ background: tierCfg ? `${tierCfg.color}20` : "rgba(255,255,255,0.1)" }}>
              <span>{tierCfg?.emoji}</span>
              <span className="text-xs font-bold" style={{ color: tierCfg?.color }}>{tierCfg?.label}</span>
            </div>
            <div className="text-white/30 text-right" style={{ fontSize: 9 }}>{completedCount} activities completed</div>
          </div>
        </div>

        {/* Milestones button */}
        <button onClick={() => navigate("milestones")}
          className="mt-2 w-full flex items-center gap-2 py-2 px-3 rounded-xl transition-all"
          style={{ background: "rgba(255,183,3,0.1)", border: "1px solid rgba(255,183,3,0.2)" }}>
          <span>📋</span>
          <span className="text-amber-300 text-xs font-semibold flex-1 text-left">Developmental Milestones Tracker</span>
          <span className="text-white/30 text-xs">→</span>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex-shrink-0 flex gap-1 px-3 pb-1 pt-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); playClick(); }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl transition-all"
            style={{
              background: tab === t.id ? "rgba(67,97,238,0.3)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${tab === t.id ? "rgba(67,97,238,0.5)" : "rgba(255,255,255,0.06)"}`,
            }}>
            <span style={{ fontSize: 12 }}>{t.emoji}</span>
            <span className="font-semibold" style={{ fontSize: 10, color: tab === t.id ? "#a5b4fc" : "rgba(255,255,255,0.4)" }}>
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} className="flex-1 flex flex-col overflow-hidden"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}>
          {tab === "brain" && <BrainMapViz scores={scores} />}
          {tab === "radar" && <RadarTab scores={scores} />}
          {tab === "plan"  && <YearPlanTab />}
          {tab === "kyc"   && <KnowYourChildTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
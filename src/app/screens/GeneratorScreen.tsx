import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { MATERIAL_OPTIONS, MOOD_OPTIONS, INTEL_COLORS, Activity, runAGE, getAgeTierConfig, buildLastCompletionMap, SKILL_TAG_UI, type AGEPersonalization } from "../data/activities";
import { buildWhyPickedLines } from "../data/activityWhy";
import { getOutcomeFocusPillars } from "../data/outcomeChecklist";
import { captureProductEvent } from "@/utils/productAnalytics";

// ─── Activity image map by primary intelligence ───────────────────────────────
const INTEL_IMAGES: Record<string, string> = {
  "Bodily-Kinesthetic":   "https://images.unsplash.com/photo-1658281381502-8f73b17b0253?w=200&q=70",
  "Naturalist":           "https://images.unsplash.com/photo-1613900315996-905dc88def9b?w=200&q=70",
  "Musical-Rhythmic":     "https://images.unsplash.com/photo-1661248822719-ef4908babf0b?w=200&q=70",
  "Creative":             "https://images.unsplash.com/photo-1685477111354-7ffb7c7d396f?w=200&q=70",
  "Linguistic":           "https://images.unsplash.com/photo-1763013259096-4e09301bdec7?w=200&q=70",
  "Logical-Mathematical": "https://images.unsplash.com/photo-1685358268305-c621b38e75d8?w=200&q=70",
  "Executive Function":   "https://images.unsplash.com/photo-1549925245-f20a1bac6454?w=200&q=70",
  "Spatial-Visual":       "https://images.unsplash.com/photo-1685358268305-c621b38e75d8?w=200&q=70",
  "Interpersonal":        "https://images.unsplash.com/photo-1760530675678-4221135a2bd3?w=200&q=70",
  "Emotional":            "https://images.unsplash.com/photo-1763013259096-4e09301bdec7?w=200&q=70",
  "Intrapersonal":        "https://images.unsplash.com/photo-1658281381502-8f73b17b0253?w=200&q=70",
  "Existential":          "https://images.unsplash.com/photo-1549925245-f20a1bac6454?w=200&q=70",
  "Digital-Technological":"https://images.unsplash.com/photo-1685358268305-c621b38e75d8?w=200&q=70",
};

function fireConfetti() {
  import("canvas-confetti").then(m => m.default({ particleCount: 60, spread: 50, origin: { y: 0.6 }, colors: ["#4361EE","#F72585","#FFB703","#06D6A0"] }));
}

type Step = "config" | "generating" | "result";

const GEN_PREFS_KEY = "neurospark_generator_prefs";

export function GeneratorScreen() {
  const {
    activeChild,
    materialInventory,
    activityLogs,
    setGeneratedPack,
    generatedPack,
    logActivity,
    kycData,
    setViewingActivity,
    navigate,
    outcomeChecklists,
    consumeCredit,
    hasCreditForToday,
    lastPackGeneratedOn,
    generatorIntent,
    clearGeneratorIntent,
  } = useApp();

  const personalization: AGEPersonalization | null = useMemo(() => {
    if (!activeChild) return null;
    const k = kycData[activeChild.id];
    if (!k) return null;
    return {
      learningStyle: k.learningStyle,
      curiosity: k.curiosity,
      energy: k.energy,
      patience: k.patience,
      creativity: k.creativity,
      social: k.social,
      energyLevel: k.energyLevel,
      adaptability: k.adaptability,
      mood: k.mood,
      sensitivity: k.sensitivity,
    };
  }, [activeChild, kycData]);

  const lastCompletionByActivity = useMemo(() => {
    if (!activeChild) return null;
    const m = buildLastCompletionMap(activityLogs, activeChild.id);
    return Object.keys(m).length > 0 ? m : null;
  }, [activityLogs, activeChild]);

  const outcomeFocusPillars = useMemo(() => {
    if (!activeChild) return [];
    return getOutcomeFocusPillars(outcomeChecklists[activeChild.id] ?? []);
  }, [activeChild, outcomeChecklists]);

  const todayKey = new Date().toDateString();
  const hasTodaysPack = Boolean(generatedPack && lastPackGeneratedOn === todayKey);
  const [step, setStep]             = useState<Step>(hasTodaysPack ? "result" : "config");
  const [mood, setMood]             = useState("focus");
  const [timeMin, setTimeMin]       = useState(45);
  const [pack, setPack]             = useState<Activity[]>(generatedPack ?? []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);
  const [rating, setRating]         = useState(4);
  const [notes, setNotes]           = useState("");
  const [earnedBP, setEarnedBP]     = useState<{[id:string]:number}>({});
  const [showBPFloat, setShowBPFloat] = useState<{[id:string]:boolean}>({});
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [boostAILiteracy, setBoostAILiteracy] = useState(false);
  const [boostDualTask, setBoostDualTask] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    setStep(hasTodaysPack ? "result" : "config");
  }, [hasTodaysPack]);

  useEffect(() => {
    if (!generatorIntent?.suggestedMood) return;
    setMood(generatorIntent.suggestedMood);
  }, [generatorIntent]);

  useEffect(() => {
    try {
      const r = localStorage.getItem(GEN_PREFS_KEY);
      if (!r) return;
      const j = JSON.parse(r) as { boostAILiteracy?: boolean; boostDualTask?: boolean };
      if (typeof j.boostAILiteracy === "boolean") setBoostAILiteracy(j.boostAILiteracy);
      if (typeof j.boostDualTask === "boolean") setBoostDualTask(j.boostDualTask);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(GEN_PREFS_KEY, JSON.stringify({ boostAILiteracy, boostDualTask }));
    } catch { /* ignore */ }
  }, [boostAILiteracy, boostDualTask]);

  const tier    = activeChild?.ageTier ?? 3;
  const tierCfg = getAgeTierConfig(tier);
  const recentIds = activityLogs.filter(l => l.childId === activeChild?.id).slice(0, 10).map(l => l.activityId);

  const generate = () => {
    if (!activeChild) return;
    if (!hasCreditForToday() || !consumeCredit()) {
      navigate("paywall");
      return;
    }
    setGenerateError(null);
    setStep("generating");
    setTimeout(() => {
      const result = runAGE(tier, materialInventory, mood, timeMin, recentIds, personalization, lastCompletionByActivity, {
        boostAILiteracy,
        boostDualTask,
        focusPillars: outcomeFocusPillars,
        priorityIntelligences: generatorIntent?.priorityIntelligences,
      });
      setPack(result);
      setGeneratedPack(result);
      setCompletedIds(new Set());
      setEarnedBP({});
      captureProductEvent("pack_generate", {
        age_tier: tier,
        mood,
        time_min: timeMin,
        pack_size: result.length,
        boost_ai_literacy: boostAILiteracy,
        boost_dual_task: boostDualTask,
        intent_source: generatorIntent?.source ?? "default",
      });
      clearGeneratorIntent();
      setStep("result");
    }, 2200);
  };

  const completeActivity = (act: Activity) => {
    if (!activeChild) return;
    const bp = logActivity({
      childId: activeChild.id, activityId: act.id, activityName: act.name, emoji: act.emoji,
      intelligences: act.intelligences, method: act.method, region: act.region, regionEmoji: act.regionEmoji,
      duration: act.duration, completed: true, engagementRating: rating, parentNotes: notes,
    });
    setEarnedBP(prev => ({ ...prev, [act.id]: bp }));
    setCompletedIds(prev => new Set([...prev, act.id]));
    setShowBPFloat(prev => ({ ...prev, [act.id]: true }));
    setTimeout(() => setShowBPFloat(prev => ({ ...prev, [act.id]: false })), 1400);
    fireConfetti();
    setCompleting(null);
    setRating(4);
    setNotes("");
  };

  const totalDur  = pack.reduce((s, a) => s + a.duration, 0);
  const coveredIntel = [...new Set(pack.flatMap(a => a.intelligences))];
  const allDone   = pack.length > 0 && pack.every(a => completedIds.has(a.id));

  if (step === "config") return (
    <ConfigScreen
      mood={mood} setMood={setMood} timeMin={timeMin} setTimeMin={setTimeMin} tier={tier} onGenerate={generate}
      boostAILiteracy={boostAILiteracy} setBoostAILiteracy={setBoostAILiteracy}
      boostDualTask={boostDualTask} setBoostDualTask={setBoostDualTask}
      generatorIntent={generatorIntent}
      canGenerateToday={hasCreditForToday()}
      generateError={generateError}
    />
  );
  if (step === "generating") return <GeneratingScreen tier={tier} />;

  return (
    <div className="h-full overflow-y-auto" style={{ background:"#F0EFFF" }}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-b-3xl mb-4"
        style={{ background:"linear-gradient(135deg,#F72585,#7209B7)" }}>
        <div className="absolute right-0 top-0 w-24 h-24 rounded-full opacity-20"
          style={{ background:"rgba(255,255,255,0.3)", transform:"translate(30%,-30%)" }}/>
        <div className="relative px-4 pt-3 pb-5">
          <div className="text-white/70 text-xs mb-1">Today's Pack for {activeChild?.name}</div>
          <div className="text-white font-black text-xl mb-2">
            {pack.length} Activities · {totalDur} min
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {coveredIntel.slice(0,5).map(i => (
              <span key={i} className="text-xs glass rounded-full px-2 py-0.5 text-white">{i.split("-")[0]}</span>
            ))}
          </div>
          {allDone && (
            <div className="mt-3 flex items-center gap-2 rounded-xl p-2.5 animate-pop-in" style={{ background:"rgba(6,214,160,0.25)" }}>
              <span className="text-xl">🎉</span>
              <span className="text-white font-semibold text-xs">All activities complete! Amazing work!</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-6 space-y-3">
        {/* Algorithm trace */}
        <div className="rounded-2xl p-3 bg-gray-900 animate-slide-up">
          <div className="text-gray-400 font-bold tracking-widest mb-1.5" style={{ fontSize:10 }}>⚙️ AGE TRACE</div>
          <div className="space-y-0.5 font-mono" style={{ fontSize:10 }}>
            <div className="text-blue-400">▸ Tier {tier} · {tierCfg.desc} · Mood: {mood}</div>
            <div className="text-green-400">▸ {pack.length} activities selected · {totalDur}min budget used</div>
            <div className="text-yellow-400">▸ {coveredIntel.length} intelligence types covered</div>
            {personalization && (
              <div className="text-purple-400">
                ▸ KYC personalization on · style:{personalization.learningStyle ?? "mixed"} · traits weighted
              </div>
            )}
            {lastCompletionByActivity && (
              <div className="text-cyan-400">
                ▸ Spaced repetition · {Object.keys(lastCompletionByActivity).length} activities in history · 24h repeat deprioritized
              </div>
            )}
            {(boostAILiteracy || boostDualTask) && (
              <div className="text-orange-300">
                ▸ Pack focus ·{" "}
                {[boostAILiteracy && "AI literacy weight + swap-in if needed", boostDualTask && "dual-task scoring boost"].filter(Boolean).join(" · ")}
              </div>
            )}
            {outcomeFocusPillars.length > 0 && (
              <div className="text-emerald-300">
                ▸ Outcome support · bias toward recent low pillars: {outcomeFocusPillars.join(", ")}
              </div>
            )}
          </div>
        </div>

        {pack.map((act, idx) => {
          const done      = completedIds.has(act.id);
          const expanded  = expandedId === act.id;
          const isCompleting = completing === act.id;
          return (
            <div key={act.id} className={`rounded-3xl overflow-hidden bg-white shadow-sm animate-slide-up stagger-${idx+1} relative`}
              style={{ border:`1px solid ${done?"rgba(6,214,160,0.4)":"#e5e7eb"}`, opacity:done?0.85:1 }}>
              {/* BP Float */}
              {showBPFloat[act.id] && (
                <div className="absolute top-2 right-4 z-20 text-yellow-500 font-black animate-bp-float pointer-events-none"
                  style={{ fontSize:18 }}>+{earnedBP[act.id]} BP ⚡</div>
              )}
              {/* Card header */}
              <button
                className="w-full text-left p-4"
                onClick={() => setExpandedId(expanded ? null : act.id)}
                onDoubleClick={() => {
                  setViewingActivity(act);
                  navigate("activity_detail");
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 relative"
                    style={{ background: done ? "rgba(6,214,160,0.15)" : "#F5F0FF" }}>
                    {!done && INTEL_IMAGES[act.intelligences[0]] ? (
                      <img src={INTEL_IMAGES[act.intelligences[0]]} alt={act.name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center text-2xl"
                      style={{ background: done ? "transparent" : INTEL_IMAGES[act.intelligences[0]] ? "transparent" : "transparent" }}>
                      {done ? "✅" : !INTEL_IMAGES[act.intelligences[0]] ? act.emoji : null}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-gray-400" style={{ fontSize:11 }}>#{idx+1}</span>
                      <span className="text-gray-400" style={{ fontSize:11 }}>{act.regionEmoji} {act.region}</span>
                      <span className="text-gray-400" style={{ fontSize:11 }}>⏱ {act.duration}m</span>
                      <span className="ml-auto text-gray-300 text-xs">{expanded?"▲":"▼"}</span>
                    </div>
                    <div className="text-gray-900 font-bold text-sm" style={{ textDecoration:done?"line-through":"none" }}>{act.name}</div>
                    <div className="text-violet-600 text-xs font-semibold mt-1">Tap to expand, or open the full detail view below</div>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {act.skillTags?.map(tag => {
                        const meta = SKILL_TAG_UI[tag];
                        if (!meta) return null;
                        return (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                            style={{ background:"rgba(251,146,60,0.15)", color:"#c2410c" }}>
                            {meta.emoji} {meta.label}
                          </span>
                        );
                      })}
                      {act.intelligences.map(intel => (
                        <span key={intel} className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background:(INTEL_COLORS[intel]??"#888")+"18", color:INTEL_COLORS[intel]??"#888" }}>
                          {intel.split("-")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded */}
              {expanded && (
                <div className="px-4 pb-4 border-t border-gray-100 space-y-3">
                  <p className="text-gray-600 text-xs leading-relaxed pt-3">{act.description}</p>
                  <div className="rounded-2xl p-3 border border-violet-100" style={{ background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)" }}>
                    <div className="text-violet-800 font-bold text-xs mb-2">💡 Why we picked this for {activeChild?.name ?? "your child"} today</div>
                    <ul className="space-y-1.5">
                      {buildWhyPickedLines(act, {
                        childName: activeChild?.name ?? "your child",
                        tier,
                        mood,
                        personalization,
                        lastCompletionByActivity,
                        recentActivityIds: recentIds,
                      }).map((line, wi) => (
                        <li key={wi} className="text-violet-900 text-xs leading-relaxed flex gap-2">
                          <span className="text-violet-400 flex-shrink-0">•</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <div className="text-gray-500 font-bold text-xs mb-2">📋 STEPS</div>
                    {act.instructions.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-700 mb-1.5">
                        <div className="w-5 h-5 rounded-full text-white flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background:"linear-gradient(135deg,#4361EE,#7209B7)", fontSize:9, fontWeight:700 }}>{i+1}</div>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  {act.materials.length > 0 && (
                    <div>
                      <div className="text-gray-500 font-bold text-xs mb-1.5">🏠 Materials Needed</div>
                      <div className="flex flex-wrap gap-1">
                        {act.materials.map(m => (
                          <span key={m} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3">
                    <div className="text-amber-700 font-bold text-xs mb-1">🔬 Why This Works</div>
                    <p className="text-amber-800 text-xs leading-relaxed">{act.parentTip}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setViewingActivity(act);
                      navigate("activity_detail");
                    }}
                    className="w-full py-2.5 rounded-2xl border border-violet-200 text-violet-700 font-bold text-sm"
                    style={{ background: "rgba(139,92,246,0.06)" }}
                  >
                    Open full detail
                  </button>
                  {!done && !isCompleting && (
                    <button onClick={() => setCompleting(act.id)}
                      className="w-full py-3 rounded-2xl font-bold text-white animate-pulse-glow"
                      style={{ background:"linear-gradient(135deg,#06D6A0,#4361EE)", boxShadow:"0 6px 20px rgba(6,214,160,0.3)" }}>
                      Mark as Complete ✓
                    </button>
                  )}
                  {isCompleting && (
                    <div className="space-y-3 animate-slide-up">
                      <div className="text-gray-700 font-bold text-xs">How much did {activeChild?.name} enjoy it?</div>
                      <div className="flex gap-2 justify-center">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setRating(s)}
                            className="text-2xl transition-all animate-star-pop"
                            style={{ transform:rating>=s?"scale(1.2)":"scale(0.9)", filter:rating>=s?"none":"grayscale(1)" }}>
                            ⭐
                          </button>
                        ))}
                      </div>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional: add a note..."
                        rows={2} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 resize-none outline-none text-xs"/>
                      <div className="flex gap-2">
                        <button onClick={() => setCompleting(null)}
                          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm">Cancel</button>
                        <button onClick={() => completeActivity(act)}
                          className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm"
                          style={{ background:"linear-gradient(135deg,#06D6A0,#4361EE)" }}>
                          Done! +{50+(rating-1)*12} BP ⚡
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button onClick={() => setStep("config")}
          className="w-full py-3.5 rounded-2xl font-bold border-2 border-purple-200 text-purple-600 text-sm">
          🔀 Generate New Pack
        </button>
      </div>
    </div>
  );
}

function ConfigScreen({ mood, setMood, timeMin, setTimeMin, tier, onGenerate, boostAILiteracy, setBoostAILiteracy, boostDualTask, setBoostDualTask, generatorIntent, canGenerateToday, generateError }: {
  mood:string; setMood:(m:string)=>void; timeMin:number; setTimeMin:(t:number)=>void;
  tier:number; onGenerate:()=>void;
  boostAILiteracy: boolean; setBoostAILiteracy: (v: boolean) => void;
  boostDualTask: boolean; setBoostDualTask: (v: boolean) => void;
  generatorIntent: ReturnType<typeof useApp>["generatorIntent"];
  canGenerateToday: boolean;
  generateError: string | null;
}) {
  const { materialInventory, setMaterialInventory, activeChild } = useApp();
  const tierCfg = getAgeTierConfig(tier);
  const toggle = (id: string) =>
    setMaterialInventory(materialInventory.includes(id) ? materialInventory.filter(m=>m!==id) : [...materialInventory, id]);

  return (
    <div className="h-full overflow-y-auto" style={{ background:"#F0EFFF" }}>
      <div className="rounded-b-3xl mb-4 px-4 pt-3 pb-5"
        style={{ background:"linear-gradient(135deg,#7209B7,#4361EE)" }}>
        <div className="text-white/70 text-xs mb-1">Activity Generator for {activeChild?.name}</div>
        <div className="text-white font-black text-xl">Configure Your Pack</div>
        <div className="text-white/60 text-xs mt-1">{tierCfg.emoji} {tierCfg.label} · {tierCfg.desc} Stage</div>
      </div>

      <div className="px-4 pb-6 space-y-5">
        {generatorIntent && (
          <div className="rounded-2xl p-3" style={{ background: "rgba(67,97,238,0.08)", border: "1px solid rgba(67,97,238,0.18)" }}>
            <div className="text-blue-700 font-semibold text-xs mb-1">Targeted support pack</div>
            <div className="text-blue-600 text-xs leading-relaxed">
              {generatorIntent.title}: {generatorIntent.note}
            </div>
          </div>
        )}
        {!canGenerateToday && (
          <div className="rounded-2xl p-3" style={{ background: "#FFF4EF", border: "1px solid rgba(251,86,7,0.25)" }}>
            <div className="text-orange-700 font-semibold text-xs mb-1">No unused daily pack credits left</div>
            <div className="text-orange-600 text-xs">Unlock another day to generate a new pack, or revisit today's completed activities from History.</div>
          </div>
        )}
        {generateError && (
          <div className="rounded-2xl p-3" style={{ background: "#FFF0F6", border: "1px solid rgba(247,37,133,0.25)" }}>
            <div className="text-pink-700 text-xs">{generateError}</div>
          </div>
        )}
        {/* Mood */}
        <div>
          <Label text="1. How is your child feeling right now?" />
          <div className="grid grid-cols-4 gap-2">
            {MOOD_OPTIONS.map(m => (
              <button key={m.id} onClick={() => setMood(m.id)}
                className="flex flex-col items-center gap-1 py-3 rounded-2xl transition-all"
                style={{ background:mood===m.id?"linear-gradient(135deg,#F72585,#7209B7)":"white",
                  border:`2px solid ${mood===m.id?"transparent":"#e5e7eb"}` }}>
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs font-semibold" style={{ color:mood===m.id?"white":"#374151" }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time */}
        <div>
          <Label text={`2. Available time: ${timeMin} minutes`} />
          <div className="flex gap-2 flex-wrap">
            {[15,30,45,60,90].map(t => (
              <button key={t} onClick={() => setTimeMin(t)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{ background:timeMin===t?"linear-gradient(135deg,#4361EE,#7209B7)":"white",
                  color:timeMin===t?"white":"#555", border:`2px solid ${timeMin===t?"transparent":"#e5e7eb"}` }}>
                {t}m
              </button>
            ))}
          </div>
        </div>

        {/* Pack focus — AI literacy & dual-task (master plan) */}
        <div>
          <Label text="3. Pack focus (optional)" />
          <p className="text-gray-500 text-xs mb-2 leading-relaxed">
            Tune the Activity Generation Engine for <strong>human + tool habits</strong> or <strong>movement + thinking</strong>. All activities stay screen-free unless you choose otherwise elsewhere.
          </p>
          <div className="space-y-2">
            <button type="button" onClick={() => setBoostAILiteracy(!boostAILiteracy)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all border-2"
              style={{ background: boostAILiteracy ? "rgba(67,97,238,0.08)" : "white", borderColor: boostAILiteracy ? "#4361EE" : "#e5e7eb" }}>
              <span className="text-2xl">🧑‍🏫</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 text-xs">Include AI literacy</div>
                <div className="text-gray-500" style={{ fontSize:10 }}>Boost unplugged verification &amp; clear-instruction games; we try to place at least one in the pack when materials allow.</div>
              </div>
              <span className="text-lg">{boostAILiteracy ? "✅" : "⬜"}</span>
            </button>
            <button type="button" onClick={() => setBoostDualTask(!boostDualTask)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all border-2"
              style={{ background: boostDualTask ? "rgba(6,214,160,0.08)" : "white", borderColor: boostDualTask ? "#06D6A0" : "#e5e7eb" }}>
              <span className="text-2xl">🔄</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-800 text-xs">Prefer dual-task</div>
                <div className="text-gray-500" style={{ fontSize:10 }}>Favor activities that pair body/rhythm with thinking (motor–cognition coupling).</div>
              </div>
              <span className="text-lg">{boostDualTask ? "✅" : "⬜"}</span>
            </button>
          </div>
        </div>

        {/* Materials */}
        <div>
          <Label text={`4. Materials at home (${materialInventory.length} selected)`} />
          <div className="flex gap-2 mb-2">
            <button onClick={() => setMaterialInventory(MATERIAL_OPTIONS.map(m=>m.id))}
              className="text-xs px-3 py-1.5 rounded-full" style={{ background:"rgba(67,97,238,0.1)", color:"#4361EE" }}>
              All
            </button>
            <button onClick={() => setMaterialInventory([])}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">Clear</button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MATERIAL_OPTIONS.map(m => {
              const sel = materialInventory.includes(m.id);
              return (
                <button key={m.id} onClick={() => toggle(m.id)}
                  className="flex items-center gap-1.5 p-2 rounded-xl text-left transition-all"
                  style={{ background:sel?"rgba(247,37,133,0.1)":"white", border:`1.5px solid ${sel?"#F72585":"#e5e7eb"}` }}>
                  <span>{m.emoji}</span>
                  <span className="text-xs font-medium truncate" style={{ color:sel?"#F72585":"#374151" }}>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={onGenerate} disabled={materialInventory.length===0}
          className="w-full py-4 rounded-2xl font-bold text-white relative overflow-hidden"
          style={{ background:materialInventory.length?"linear-gradient(135deg,#F72585,#7209B7)":"#e5e7eb",
            boxShadow:materialInventory.length?"0 8px 24px rgba(247,37,133,0.4)":"none" }}>
          <span className="relative z-10" style={{ fontSize:16 }}>⚡ Generate My Pack</span>
          {materialInventory.length>0 && <div className="absolute inset-0 animate-shimmer"/>}
        </button>
      </div>
    </div>
  );
}

function GeneratingScreen({ tier: _tier }: { tier: number }) {
  const [dots, setDots] = useState(0);
  const phases = ["Analysing developmental stage...","Scoring 25 activities...","Applying diversity rules...","Selecting optimal pack...","Adding parent tips..."];
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    const t1 = setInterval(() => setDots(d => (d + 1) % 4), 400);
    const t2 = setInterval(() => setPhaseIdx(i => Math.min(i + 1, phases.length - 1)), 400);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6"
      style={{ background:"linear-gradient(160deg,#0f0c29,#302b63)" }}>
      <div className="relative mb-8">
        {/* Outer ring */}
        <div className="w-32 h-32 rounded-full animate-spin-slow"
          style={{ background:"conic-gradient(from 0deg,#4361EE,#F72585,#7209B7,#4361EE)", padding:3 }}>
          <div className="w-full h-full rounded-full flex items-center justify-center"
            style={{ background:"#1a1a2e" }}>
            <span className="text-5xl animate-brain-pulse">🧠</span>
          </div>
        </div>
        {/* Orbiting dots */}
        {[0,1,2].map(i => (
          <div key={i} className="absolute w-3 h-3 rounded-full animate-spin-slow"
            style={{ background:["#4361EE","#F72585","#FFB703"][i], top:"50%", left:"50%",
              transformOrigin:`${64+(i*12)}px center`, transform:`rotate(${i*120}deg)`,
              animationDuration:`${2+i*0.5}s` }}/>
        ))}
      </div>

      <div className="text-white font-black text-xl mb-2 animate-fade-in text-center">
        AGE Algorithm Running{".".repeat(dots)}
      </div>
      <div className="text-white/60 text-sm mb-8 animate-fade-in text-center">{phases[phaseIdx]}</div>

      <div className="w-full space-y-2">
        {[
          { label:"Age Tier Match", color:"#4361EE", delay:0     },
          { label:"Intelligence Balance", color:"#F72585", delay:0.3  },
          { label:"Material Availability", color:"#06D6A0", delay:0.6  },
          { label:"Cultural Diversity", color:"#FFB703", delay:0.9  },
          { label:"Anti-Repetition Rule", color:"#7209B7", delay:1.2  },
        ].map(f => (
          <div key={f.label} className="animate-slide-left" style={{ animationDelay:`${f.delay}s` }}>
            <div className="flex justify-between text-white/50 mb-1" style={{ fontSize:10 }}>
              <span>{f.label}</span><span>✓</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full animate-shimmer" style={{ width:"100%", background:f.color }}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Label({ text }: { text: string }) {
  return <div className="text-gray-700 font-bold text-xs mb-2.5">{text}</div>;
}
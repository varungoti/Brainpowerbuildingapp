import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";
import brainBase from "../../assets/brain-progress-base.png";
import {
  CATEGORY_INFO, getMilestonesForAge,
  isMilestoneOverdue, getConcernLevel,
  type Milestone, type MilestoneCategory,
} from "../data/milestones";
import { playClick, playActivityComplete } from "../utils/audioEffects";
import {
  BRAIN_REGIONS,
  buildRegionScoresFromWeightedKeys,
  getActiveBrainRegionCount,
  getSortedBrainRegionProgress,
} from "../data/brainRegions";

// ─── Concern Activity Generator ───────────────────────────────────────────────
const CONCERN_ACTIVITIES: Record<string, { title: string; desc: string; duration: string; emoji: string }[]> = {
  speech: [
    { title: "Narration Walk", desc: "Walk around the house narrating everything you see and do. 'I'm opening the door. The door is brown.'", duration: "10 min", emoji: "🚶" },
    { title: "Song Repetition", desc: "Sing a simple song 3 times. First time sing fully, second pause for child to fill words, third let them lead.", duration: "5 min", emoji: "🎵" },
    { title: "Picture Dialogue", desc: "Use picture books but don't read — ask 'What's happening here?' and expand on every word they say.", duration: "8 min", emoji: "📖" },
    { title: "Sound Imitation Game", desc: "Make animal/vehicle sounds and have child copy. Progress from simple ('moo') to complex ('vroom-vroom').", duration: "5 min", emoji: "🐮" },
  ],
  motor_gross: [
    { title: "Pillow Obstacle Course", desc: "Arrange pillows and cushions for climbing over, crawling under, and jumping between.", duration: "15 min", emoji: "🏋️" },
    { title: "Animal Walks", desc: "Walk like a bear (hands and feet), hop like a frog, waddle like a penguin, slither like a snake.", duration: "10 min", emoji: "🐻" },
    { title: "Balloon Keep-Up", desc: "Hit a balloon up and try not to let it touch the ground. Works balance, tracking, and coordination.", duration: "8 min", emoji: "🎈" },
    { title: "Dance Freeze", desc: "Play music and dance, when music stops — freeze! Builds body control and listening.", duration: "10 min", emoji: "💃" },
  ],
  motor_fine: [
    { title: "Playdough Squeeze", desc: "Roll snakes, pinch small balls, poke with fingers. Builds hand strength and dexterity.", duration: "10 min", emoji: "🎨" },
    { title: "Transfer Games", desc: "Move beans/rice between bowls using spoons, tongs, or fingers. Montessori classic.", duration: "8 min", emoji: "🥄" },
    { title: "Threading Practice", desc: "Thread large beads onto string or pipe cleaners. Progress to smaller beads over time.", duration: "10 min", emoji: "📿" },
    { title: "Tear & Paste Collage", desc: "Tear paper into pieces and paste onto a drawing. Builds pincer strength without scissors.", duration: "12 min", emoji: "📋" },
  ],
  cognitive: [
    { title: "Sorting Safari", desc: "Sort household items by color, size, or type. Ask child to explain their sorting rule.", duration: "10 min", emoji: "🔶" },
    { title: "Memory Card Game", desc: "Place 4–6 cards face down, flip two at a time to find matches. Builds working memory.", duration: "8 min", emoji: "🃏" },
    { title: "Pattern Building", desc: "Create a simple ABAB pattern with blocks/spoons and ask child to continue it.", duration: "8 min", emoji: "🧱" },
    { title: "What's Missing?", desc: "Show 3–5 objects, hide one while child closes eyes. Can they spot what's missing?", duration: "5 min", emoji: "🔍" },
  ],
  social: [
    { title: "Pretend Tea Party", desc: "Set up a tea party with stuffed animals. Practice greetings, sharing, and manners.", duration: "15 min", emoji: "🍵" },
    { title: "Turn-Taking Tower", desc: "Build a block tower taking turns placing one block each. Teaches patience and cooperation.", duration: "8 min", emoji: "🏗️" },
    { title: "Emotion Charades", desc: "Act out emotions and guess them. Builds social awareness and empathy.", duration: "10 min", emoji: "🎭" },
    { title: "Helper Tasks", desc: "Give child a real household task: setting napkins, watering plants. Builds responsibility.", duration: "10 min", emoji: "🌱" },
  ],
  emotional: [
    { title: "Feelings Check-In", desc: "Use a feelings chart. 'Point to how you feel right now.' Validate whatever they choose.", duration: "3 min", emoji: "🎯" },
    { title: "Calm-Down Corner", desc: "Create a cozy corner with soft items. Practice going there when overwhelmed (not as punishment).", duration: "5 min", emoji: "🧸" },
    { title: "Breathing Buddies", desc: "Lie down with a stuffed animal on tummy. Breathe slowly to make the buddy rise and fall.", duration: "5 min", emoji: "🧘" },
    { title: "Story Feelings", desc: "Read a story and pause: 'How do you think the character feels? Why? Have you felt that?'", duration: "10 min", emoji: "📚" },
  ],
  self_care: [
    { title: "Routine Chart", desc: "Make a visual chart of daily routines with pictures. Child checks off completed tasks.", duration: "10 min", emoji: "✅" },
    { title: "Dress-Up Practice", desc: "Practice buttons, zippers, and shoe-tying with oversized clothes or a dressing frame.", duration: "10 min", emoji: "👔" },
    { title: "Kitchen Helper", desc: "Wash vegetables, stir batter, set the table. Builds independence and confidence.", duration: "15 min", emoji: "🍳" },
    { title: "Hygiene Song", desc: "Create a song for handwashing or tooth-brushing. Makes routines fun and memorable.", duration: "5 min", emoji: "🪥" },
  ],
  sensory: [
    { title: "Texture Exploration", desc: "Collect items with different textures. Close eyes and guess what you're touching.", duration: "8 min", emoji: "🖐️" },
    { title: "Sound Safari", desc: "Go outside and listen silently for 1 minute. How many different sounds can you count?", duration: "5 min", emoji: "👂" },
    { title: "Color Mixing", desc: "Mix primary colors with water/paint. Predict what new color will appear.", duration: "10 min", emoji: "🎨" },
    { title: "Smell Jars", desc: "Put different scents in jars (vanilla, lemon, cinnamon). Can child identify them blindfolded?", duration: "8 min", emoji: "👃" },
  ],
};

function getChildAgeMonths(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

// ─── Milestone Card ───────────────────────────────────────────────────────────
function MilestoneCard({
  milestone, childAge, checked, onToggle, onConcern,
}: {
  milestone: Milestone; childAge: number; checked: boolean;
  onToggle: () => void; onConcern: () => void;
}) {
  const concern = getConcernLevel(milestone, childAge);
  const catInfo = CATEGORY_INFO[milestone.category];
  const overdue = isMilestoneOverdue(milestone, childAge);

  const borderColor = checked ? "#06D6A0" : concern === "concern" ? "#E63946" : concern === "watch" ? "#FFB703" : "rgba(255,255,255,0.1)";
  const bgColor = checked ? "rgba(6,214,160,0.08)" : concern === "concern" ? "rgba(230,57,70,0.08)" : "rgba(255,255,255,0.04)";

  return (
    <motion.div
      layout
      className="rounded-2xl p-3.5 relative overflow-hidden"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => { onToggle(); playClick(); }}
          aria-label={checked ? `Mark ${milestone.title} incomplete` : `Mark ${milestone.title} complete`}
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
          style={{
            background: checked ? "#06D6A0" : "rgba(255,255,255,0.08)",
            border: `2px solid ${checked ? "#06D6A0" : "rgba(255,255,255,0.2)"}`,
          }}
        >
          {checked && <span className="text-white text-sm font-bold">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{milestone.emoji}</span>
            <span className={`text-white text-xs font-bold ${checked ? "line-through opacity-50" : ""}`}>
              {milestone.title}
            </span>
            {concern === "concern" && !checked && (
              <span className="px-1.5 py-0.5 rounded-full text-red-300 bg-red-900/40" style={{ fontSize: 8 }}>Overdue</span>
            )}
            {concern === "watch" && !checked && (
              <span className="px-1.5 py-0.5 rounded-full text-amber-300 bg-amber-900/40" style={{ fontSize: 8 }}>Watch</span>
            )}
          </div>
          <div className="text-white/50 text-xs leading-relaxed mb-1.5">{milestone.description}</div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${catInfo.color}20`, color: catInfo.color, fontSize: 9 }}>
              {catInfo.emoji} {catInfo.label}
            </span>
            <span className="text-white/30" style={{ fontSize: 9 }}>
              Expected: {milestone.ageMonths < 12 ? `${milestone.ageMonths}mo` : `${Math.floor(milestone.ageMonths / 12)}y${milestone.ageMonths % 12 ? ` ${milestone.ageMonths % 12}mo` : ""}`}
            </span>
          </div>
        </div>
      </div>

      {/* Concern button */}
      {!checked && (overdue || concern !== "on_track") && (
        <button
          onClick={onConcern}
          aria-label={`Get activities for ${milestone.title}`}
          className="mt-2.5 w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          style={{ background: "rgba(230,57,70,0.12)", color: "#E63946", border: "1px solid rgba(230,57,70,0.2)" }}
        >
          <span>🩺</span> Get Activities for This Concern
        </button>
      )}
    </motion.div>
  );
}

// ─── Concern Activities Panel ─────────────────────────────────────────────────
function ConcernPanel({ milestone, onClose }: { milestone: Milestone; onClose: () => void }) {
  const { navigate, setGeneratorIntent } = useApp();
  const activities = CONCERN_ACTIVITIES[milestone.category] ?? CONCERN_ACTIVITIES.cognitive;
  const catInfo = CATEGORY_INFO[milestone.category];
  const suggestedMood =
    milestone.category === "emotional" ? "calm" :
    milestone.category === "motor_gross" ? "high" :
    milestone.category === "speech" ? "focus" :
    "focus";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="absolute inset-0 z-20 flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg,#0d0d1a,#1a1a35)" }}
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ background: `linear-gradient(135deg,${catInfo.color}15,transparent)` }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white text-lg">‹</span>
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: `${catInfo.color}20`, color: catInfo.color }}>
            {catInfo.emoji} {catInfo.label}
          </span>
        </div>
        <div className="text-white font-black text-base mb-1">Help for: {milestone.title}</div>
        <div className="text-white/50 text-xs leading-relaxed">{milestone.description}</div>
        <div className="mt-2 p-2.5 rounded-xl" style={{ background: "rgba(230,57,70,0.1)", border: "1px solid rgba(230,57,70,0.2)" }}>
          <div className="text-red-300 text-xs font-semibold mb-0.5">🚩 When to seek help</div>
          <div className="text-red-200/70 text-xs">{milestone.redFlags}</div>
        </div>
        <button
          onClick={() => {
            setGeneratorIntent({
              source: "milestone_concern",
              title: `Support ${milestone.title}`,
              note: `Generate a pack targeting ${milestone.brainRegions.join(", ")} with milestone-aware activities.`,
              suggestedMood,
              priorityIntelligences: milestone.brainRegions,
            });
            onClose();
            navigate("generate");
          }}
          className="mt-3 w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          style={{ background: `${catInfo.color}18`, color: catInfo.color, border: `1px solid ${catInfo.color}35` }}
        >
          <span>⚡</span> Generate Targeted Support Pack
        </button>
      </div>

      {/* Activities */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3" style={{ scrollbarWidth: "none" }}>
        <div className="text-white/60 text-xs font-semibold pt-2 pb-1">
          🎯 Recommended Activities ({activities.length})
        </div>
        {activities.map((act, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-3.5"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${catInfo.color}15` }}>
                {act.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-xs">{act.title}</span>
                  <span className="text-white/30" style={{ fontSize: 9 }}>{act.duration}</span>
                </div>
                <div className="text-white/55 text-xs leading-relaxed">{act.desc}</div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Brain regions this milestone connects to */}
        <div className="rounded-2xl p-3.5 mt-2" style={{ background: "rgba(67,97,238,0.08)", border: "1px solid rgba(67,97,238,0.15)" }}>
          <div className="text-white/60 text-xs font-semibold mb-2">🧠 Brain Regions Activated</div>
          <div className="flex flex-wrap gap-1.5">
            {milestone.brainRegions.map(r => (
              <span key={r} className="px-2 py-1 rounded-full text-xs bg-white/10 text-white/70">{r}</span>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-2xl p-3.5" style={{ background: "rgba(6,214,160,0.08)", border: "1px solid rgba(6,214,160,0.15)" }}>
          <div className="text-emerald-300 text-xs font-semibold mb-1.5">💡 Parent Tips</div>
          <div className="text-white/55 text-xs leading-relaxed space-y-1.5">
            <p>• Every child develops at their own pace. Ranges in milestone charts are averages.</p>
            <p>• Consistent daily practice (even 5 minutes) is more effective than occasional long sessions.</p>
            <p>• Make activities playful — pressure and anxiety actually slow development.</p>
            <p>• If you're concerned, consult your pediatrician. Early intervention has the best outcomes.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Milestones Screen ───────────────────────────────────────────────────
export function MilestonesScreen() {
  const { activeChild, navigate, goBack, milestoneChecks, toggleMilestoneCheck } = useApp();
  const [filter, setFilter] = useState<MilestoneCategory | "all">("all");
  const [concernMilestone, setConcernMilestone] = useState<Milestone | null>(null);

  const checkedIds = useMemo(
    () => new Set(activeChild ? (milestoneChecks[activeChild.id] ?? []) : []),
    [activeChild, milestoneChecks],
  );

  const childAge = activeChild ? getChildAgeMonths(activeChild.dob) : 24;

  const relevantMilestones = useMemo(() => getMilestonesForAge(childAge), [childAge]);
  const milestones = useMemo(() => {
    if (filter === "all") return relevantMilestones;
    return relevantMilestones.filter(m => m.category === filter);
  }, [filter, relevantMilestones]);

  const toggleMilestone = (id: string) => {
    if (!activeChild) return;
    if (!checkedIds.has(id)) playActivityComplete();
    toggleMilestoneCheck(activeChild.id, id);
  };

  const overdueCount = relevantMilestones.filter(m => !checkedIds.has(m.id) && isMilestoneOverdue(m, childAge)).length;
  const completedCount = relevantMilestones.filter(m => checkedIds.has(m.id)).length;
  const pct = relevantMilestones.length > 0 ? Math.round((completedCount / relevantMilestones.length) * 100) : 0;
  const categoryProgress = (Object.keys(CATEGORY_INFO) as MilestoneCategory[]).map((category) => {
    const categoryMilestones = relevantMilestones.filter((milestone) => milestone.category === category);
    const done = categoryMilestones.filter((milestone) => checkedIds.has(milestone.id)).length;
    const percent = categoryMilestones.length > 0 ? Math.round((done / categoryMilestones.length) * 100) : 0;
    return {
      category,
      info: CATEGORY_INFO[category],
      total: categoryMilestones.length,
      done,
      percent,
    };
  }).filter((entry) => entry.total > 0);
  const milestoneRegionScores = buildRegionScoresFromWeightedKeys(
    relevantMilestones.map((milestone) => ({
      keys: milestone.brainRegions,
      weight: checkedIds.has(milestone.id) ? 1 : 0,
    })),
  );
  const strongestRegions = getSortedBrainRegionProgress(milestoneRegionScores)
    .filter((region) => region.score > 0)
    .slice(0, 4);
  const activeBrainRegions = getActiveBrainRegionCount(milestoneRegionScores);

  const categories: (MilestoneCategory | "all")[] = ["all", ...Object.keys(CATEGORY_INFO) as MilestoneCategory[]];

  if (!activeChild) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-5 text-center gap-4"
        style={{ background: "linear-gradient(160deg,#0f0f1a,#1a1a2e)" }}>
        <div className="text-5xl">📋</div>
        <div className="text-white font-bold text-base">Add a child first</div>
        <button onClick={() => navigate("add_child")}
          className="px-6 py-3 rounded-2xl text-white font-semibold text-sm"
          style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>
          Add Child Profile
        </button>
      </div>
    );
  }

  const ageLabel = childAge < 12 ? `${childAge} months` : `${Math.floor(childAge / 12)} year${Math.floor(childAge / 12) > 1 ? "s" : ""} ${childAge % 12 ? `${childAge % 12}mo` : ""}`;

  return (
    <div className="h-full flex flex-col overflow-hidden relative" style={{ background: "linear-gradient(160deg,#080816,#12122a)" }}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-2" style={{ background: "linear-gradient(180deg,rgba(67,97,238,0.12),transparent)" }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={goBack} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white text-lg">‹</span>
          </button>
          <div className="flex-1">
            <div className="text-white font-black text-base">Developmental Milestones</div>
            <div className="text-white/40 text-xs">{activeChild.name} · {ageLabel}</div>
          </div>
          {overdueCount > 0 && (
            <div className="px-2.5 py-1 rounded-full bg-red-900/40 border border-red-800/40">
              <span className="text-red-300 text-xs font-bold">{overdueCount} overdue</span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1 }}
              style={{ background: "linear-gradient(90deg,#06D6A0,#4361EE)" }} />
          </div>
          <span className="text-white/60 text-xs font-bold">{pct}%</span>
        </div>

        <div
          className="mb-2 rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3 p-3">
            <div className="relative w-28 h-24 flex-shrink-0 rounded-2xl overflow-hidden" style={{ background: "radial-gradient(circle at 30% 30%,rgba(67,97,238,0.35),transparent 55%), #0d1228" }}>
              <img
                src={brainBase}
                alt="Colorful brain development map"
                className="absolute inset-0 w-full h-full object-contain"
              />
              {strongestRegions.map((region) => (
                <div
                  key={region.id}
                  className="absolute rounded-full transition-all duration-700"
                  style={{
                    width: 10 + Math.round(region.percent / 8),
                    height: 10 + Math.round(region.percent / 8),
                    left: `${(region.cx / 400) * 100}%`,
                    top: `${(region.cy / 360) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    background: `${region.color}55`,
                    border: `1px solid ${region.color}aa`,
                    boxShadow: `0 0 18px ${region.color}70`,
                    backdropFilter: "blur(2px)",
                  }}
                />
              ))}
              <div className="absolute inset-x-3 bottom-2 h-1.5 rounded-full overflow-hidden bg-black/30">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  style={{ background: "linear-gradient(90deg,#F72585,#4361EE,#06D6A0)" }}
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-white font-black text-sm">Brain Development Progress</div>
              <div className="text-white/45 text-xs leading-relaxed mt-0.5">
                Milestones now map into the same 15-region brain model used across the rest of the app.
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-white/80">
                  {completedCount}/{relevantMilestones.length} completed
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-white/80">
                  {activeBrainRegions}/{BRAIN_REGIONS.length} brain regions active
                </span>
              </div>
              {strongestRegions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {strongestRegions.map((region) => (
                    <span
                      key={region.id}
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={{ background: `${region.color}20`, color: region.color }}
                    >
                      {region.emoji} {region.name} {region.percent}%
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {categoryProgress.length > 0 && (
            <div className="px-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                {categoryProgress.slice(0, 4).map((entry) => (
                  <div
                    key={entry.category}
                    className="rounded-2xl p-2.5"
                    style={{ background: `${entry.info.color}12`, border: `1px solid ${entry.info.color}25` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold" style={{ color: entry.info.color }}>
                        {entry.info.emoji} {entry.info.label}
                      </span>
                      <span className="text-white/55 text-xs">{entry.percent}%</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${entry.percent}%`, background: entry.info.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {categories.map(cat => {
            const isAll = cat === "all";
            const info = isAll ? null : CATEGORY_INFO[cat];
            const active = filter === cat;
            return (
              <button key={cat} onClick={() => { setFilter(cat); playClick(); }}
                className="flex-shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  background: active ? "rgba(67,97,238,0.3)" : "rgba(255,255,255,0.05)",
                  color: active ? "#a5b4fc" : "rgba(255,255,255,0.4)",
                  border: `1px solid ${active ? "rgba(67,97,238,0.4)" : "rgba(255,255,255,0.06)"}`,
                }}>
                {isAll ? "📋 All" : `${info!.emoji} ${info!.label}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Milestone list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2.5 pt-2" style={{ scrollbarWidth: "none" }}>
        {milestones.length === 0 ? (
          <div className="text-center text-white/30 text-sm mt-8">No milestones for this age range</div>
        ) : (
          milestones.map(m => (
            <MilestoneCard key={m.id}
              milestone={m}
              childAge={childAge}
              checked={checkedIds.has(m.id)}
              onToggle={() => toggleMilestone(m.id)}
              onConcern={() => setConcernMilestone(m)}
            />
          ))
        )}
      </div>

      {/* Concern overlay */}
      <AnimatePresence>
        {concernMilestone && (
          <ConcernPanel milestone={concernMilestone} onClose={() => setConcernMilestone(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

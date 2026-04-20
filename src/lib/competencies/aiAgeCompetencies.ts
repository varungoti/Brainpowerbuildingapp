// ============================================================================
// AI-AGE READINESS — Competency framework
// ----------------------------------------------------------------------------
// Twelve evidence-grounded competencies that prepare children (0-12) for a
// world saturated with LLMs and autonomous AI. This module is the single
// source of truth for:
//   - Competency definitions (id, label, definition, citations)
//   - The heuristic that maps an existing Activity onto one or more
//     competencies (so all 70+ legacy activities get tagged automatically)
//   - Helpers used by the scoring engine and recommendation engine
//     (`competencyDeltasFromIntelligences`, `pickPriorityCompetencies`).
//
// Design notes
//   - We use a *parallel* vector to the existing `intelligenceScores` rather
//     than overloading it. This keeps the brain-region UI stable while letting
//     us evolve the AI-age dimensions independently.
//   - Tagging is pure-functional and deterministic so it can be precomputed at
//     activity-load time and round-tripped through tests.
//   - Every dimension cites primary research (Diamond, EEF, OECD, WEF,
//     UNESCO, Stanford SHEG, Brynjolfsson, Acemoglu, Skene, Kuyken). We avoid
//     dimensions that the literature has invalidated (generic growth-mindset
//     boosters, "learning styles", brain-training transfer claims).
// ============================================================================

import type { Activity } from "../../app/data/activities";

/** Stable string IDs — used across persisted state, scoring, and tests. */
export const AI_AGE_COMPETENCY_IDS = [
  "executive-function",
  "metacognitive-self-direction",
  "long-horizon-agency",
  "embodied-mastery",
  "deep-knowledge-retrieval",
  "guided-curiosity",
  "ai-literacy-cocreation",
  "lateral-source-evaluation",
  "creative-generation",
  "social-attunement",
  "emotional-resilience",
  "ethical-judgment",
] as const;

export type AIAgeCompetencyId = (typeof AI_AGE_COMPETENCY_IDS)[number];

export interface AIAgeCompetency {
  id: AIAgeCompetencyId;
  label: string;
  emoji: string;
  color: string;
  /** What we mean by this competency, in one sentence a parent can read. */
  definition: string;
  /** Why it matters specifically as AI saturates daily life. */
  whyAIAge: string;
  /** Plain-language age guidance — when this is most trainable and how. */
  ageNotes: string;
  /** Short citations supporting the dimension (also surfaced in the roadmap doc). */
  evidence: string[];
}

/**
 * Twelve dimensions. Order is intentional: foundational first
 * (EF, metacognition, agency, embodiment), then knowledge mechanics
 * (retrieval, curiosity), then AI-era specifics (literacy, lateral
 * reading, creative generation), then human moats (social, emotional,
 * ethical).
 */
export const AI_AGE_COMPETENCIES: readonly AIAgeCompetency[] = [
  {
    id: "executive-function",
    label: "Executive Function",
    emoji: "🧠",
    color: "#14213D",
    definition:
      "Working memory, inhibitory control, and cognitive flexibility — the mental controller that turns intent into action.",
    whyAIAge:
      "When AI removes external structure, internal self-direction becomes the foundation for everything else.",
    ageNotes:
      "Highest leverage at 3–7. Train through whole-environment activities (dramatic play, complex sport, dance) not isolated brain-training games.",
    evidence: [
      "Diamond & Ling (2016) Dev. Cog. Neuroscience — what works to improve EFs",
      "Moffitt et al. (2011) — childhood EF predicts adult outcomes",
    ],
  },
  {
    id: "metacognitive-self-direction",
    label: "Metacognitive Self-Direction",
    emoji: "🪞",
    color: "#118AB2",
    definition:
      "Knowing what you know, what you need, and whether an answer (yours or an AI's) is good enough.",
    whyAIAge:
      "When any answer is one prompt away, the differentiating skill is judging which answer is true and which is bluff.",
    ageNotes:
      "Emerges ~5; explicit teaching from 7+ via plan/monitor/evaluate prompts and adult think-alouds.",
    evidence: [
      "EEF Metacognition & Self-Regulated Learning (+7 months impact)",
      "Microsoft Research (2025) — GenAI use lowers critical-thinking effort without verification habits",
    ],
  },
  {
    id: "long-horizon-agency",
    label: "Long-Horizon Project Agency",
    emoji: "🗺️",
    color: "#7209B7",
    definition:
      "Owning a multi-day or multi-week goal — planning, persisting, recovering from setbacks.",
    whyAIAge:
      "LLMs systematically fail at long-horizon planning (HeroBench 2025); multi-step real-world goal pursuit is a durable human edge.",
    ageNotes:
      "3-day mini-projects at 5–7; 2–6 week passion projects by 8–12. Always with milestone check-ins.",
    evidence: [
      "HeroBench (2025) & UltraHorizon — LLM planning failure benchmarks",
      "OECD Learning Compass 2030 — anticipation→action→reflection cycle",
    ],
  },
  {
    id: "embodied-mastery",
    label: "Embodied Mastery",
    emoji: "🤸",
    color: "#FB5607",
    definition:
      "Skilled movement coupled with thinking — fine and gross motor control plus body-aware cognition.",
    whyAIAge:
      "AI has no body. Embodied skill is durable, joyful, and causally develops executive function in early childhood.",
    ageNotes:
      "Critical 0–7. Daily, joyful, progressively challenging. Object-control sport and craft beat passive aerobic activity for cognitive gains.",
    evidence: [
      "Wang et al. (2024) Sci. Reports — motor interventions causally improve EF",
      "Gottwald et al. (2016) Psych Science — early motor predicts EF",
    ],
  },
  {
    id: "deep-knowledge-retrieval",
    label: "Deep Knowledge & Retrieval",
    emoji: "📚",
    color: "#3A0CA3",
    definition:
      "Genuine, retrievable understanding built through retrieval practice, spaced repetition, interleaving and feedback.",
    whyAIAge:
      "You can only evaluate AI output competently if you actually understand the subject matter.",
    ageNotes:
      "From ~6 when reading fluency permits. Always paired with feedback. Effects strongest for lower-attaining students.",
    evidence: [
      "Donoghue & Hattie (2021) — retrieval/spacing top of 10-technique meta-analysis",
      "Yang et al. (2025) Ed. Psych. Review — spacing meta-analysis g≈0.28 in maths",
    ],
  },
  {
    id: "guided-curiosity",
    label: "Guided-Play Curiosity",
    emoji: "🔍",
    color: "#FFB703",
    definition:
      "Adult-scaffolded, child-directed exploration — the sweet spot between rote instruction and unstructured free play.",
    whyAIAge:
      "Curiosity is in WEF's top 8 employer-rated skills; guided play measurably beats both rote and free play on early academics + EF.",
    ageNotes:
      "Dominant mode 0–7; valuable through 12 in any open-ended materials context.",
    evidence: [
      "Skene et al. (2022) Child Development — guided-play meta-analysis",
      "WEF Future of Jobs 2025 — curiosity in top growing skills",
    ],
  },
  {
    id: "ai-literacy-cocreation",
    label: "AI Literacy & Co-Creation",
    emoji: "🤖",
    color: "#0077B6",
    definition:
      "Understanding what AI is, how it perceives and reasons, when to use it, and how to direct it ethically.",
    whyAIAge:
      "UNESCO frames the goal as ethical co-creators, not passive users — and that posture is teachable from age 5.",
    ageNotes:
      "Concepts and stories from 5–7 (often unplugged); supervised tool use 8+; design and critique 10+.",
    evidence: [
      "UNESCO AI Competency Framework for Students (2024)",
      "AI4K12 'Five Big Ideas' (AAAI/CSTA)",
    ],
  },
  {
    id: "lateral-source-evaluation",
    label: "Lateral Source Evaluation",
    emoji: "🔎",
    color: "#06D6A0",
    definition:
      "Leaving any one source — a website, a book, an AI answer — to triangulate the claim against other reputable sources.",
    whyAIAge:
      "AI-generated misinformation is now zero-cost; lateral reading is the new floor of literacy.",
    ageNotes:
      "8+ for the full move. Younger kids: simpler 'who told you that, how do they know?' family rule.",
    evidence: [
      "Stanford SHEG / Civic Online Reasoning — Wineburg et al. (2022)",
    ],
  },
  {
    id: "creative-generation",
    label: "Creative Generation",
    emoji: "🎨",
    color: "#F72585",
    definition:
      "Divergent ideation paired with convergent selection — finding problems worth solving and combining concepts in novel ways.",
    whyAIAge:
      "AI is a generation accelerator; the human moat is taste, problem-framing, and the courage to pick.",
    ageNotes:
      "All ages. Verbal-creativity training stronger 8–12. Use problem-finding + conceptual-combination prompts, not generic 'be creative'.",
    evidence: [
      "Scott, Leritz & Mumford (2004) — creativity training meta-analysis",
      "Brynjolfsson, Li & Raymond (2023) NBER — judgement/taste rises in value with AI",
    ],
  },
  {
    id: "social-attunement",
    label: "Social Attunement",
    emoji: "🤝",
    color: "#FFD166",
    definition:
      "Empathy, active listening, perspective-taking, conflict navigation — the fabric of human collaboration.",
    whyAIAge:
      "Empathy, active listening and leadership are all in WEF's top 10 skills; AI cannot replace human social fabric.",
    ageNotes:
      "Continuous 0–12. Family / peer co-play is more powerful than solo apps; service projects deepen the muscle.",
    evidence: [
      "WEF Future of Jobs 2025 — empathy + active listening + leadership in top 10",
    ],
  },
  {
    id: "emotional-resilience",
    label: "Emotional Resilience & AI Hygiene",
    emoji: "🌱",
    color: "#E63946",
    definition:
      "Naming feelings, recovering from setbacks, healthy relationships with people AND with AI tools (not as friends).",
    whyAIAge:
      "Diamond: EFs collapse under stress and loneliness. Emerging evidence shows over-reliance on AI companions follows behavioural-addiction patterns in vulnerable youth.",
    ageNotes:
      "0–5: parental co-regulation. 6–12: self-regulation skill building. Skip universal mindfulness pushes (MYRIAD trial).",
    evidence: [
      "Kuyken et al. (2022) MYRIAD — universal mindfulness null/harmful",
      "arXiv 2507.15783 (2025) — adolescent AI-companion attachment risks",
    ],
  },
  {
    id: "ethical-judgment",
    label: "Ethical Judgment Under Uncertainty",
    emoji: "⚖️",
    color: "#6B4FBB",
    definition:
      "Reasoning about should-we, not just can-we — weighing competing values when the right answer is unclear.",
    whyAIAge:
      "When AI gives plausible-sounding answers to anything, the human job is to ask whether we should act on them.",
    ageNotes:
      "Concrete dilemmas 4–7; abstract trade-offs 8–12. Use story-based dilemmas + UNESCO-aligned AI-ethics scenarios.",
    evidence: [
      "OECD Learning Compass 2030 — 'Reconciling tensions and dilemmas'",
      "UNESCO AI Competency Framework — ethics as competency #1",
    ],
  },
];

const COMPETENCY_BY_ID: Record<AIAgeCompetencyId, AIAgeCompetency> = AI_AGE_COMPETENCIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<AIAgeCompetencyId, AIAgeCompetency>,
);

export function getCompetency(id: AIAgeCompetencyId): AIAgeCompetency {
  return COMPETENCY_BY_ID[id];
}

// ----------------------------------------------------------------------------
// HEURISTIC: existing Activity → AI-age competencies
//
// We don't require every activity to be hand-tagged. Instead, we derive
// competency tags from fields we already maintain (intelligences, skillTags,
// method, mechanismTags, duration, ageTiers). Anything an author tags
// explicitly via `competencyTags` overrides the heuristic.
// ----------------------------------------------------------------------------

const INTEL_TO_COMPETENCIES: Record<string, AIAgeCompetencyId[]> = {
  "Executive Function": ["executive-function"],
  "Intrapersonal": ["metacognitive-self-direction", "emotional-resilience"],
  "Emotional": ["emotional-resilience", "social-attunement"],
  "Interpersonal": ["social-attunement"],
  "Logical-Mathematical": ["deep-knowledge-retrieval"],
  "Linguistic": ["deep-knowledge-retrieval"],
  "Pronunciation": ["deep-knowledge-retrieval"],
  "Spatial-Visual": ["embodied-mastery"],
  "Bodily-Kinesthetic": ["embodied-mastery"],
  "Coordination": ["embodied-mastery"],
  "Creative": ["creative-generation"],
  "Naturalist": ["guided-curiosity"],
  "Musical-Rhythmic": ["embodied-mastery"],
  "Digital-Technological": ["ai-literacy-cocreation"],
  "Existential": ["ethical-judgment"],
};

const METHOD_TO_COMPETENCIES: Array<{ matcher: RegExp; ids: AIAgeCompetencyId[] }> = [
  { matcher: /spaced.*repetition|leitner|retrieval/i, ids: ["deep-knowledge-retrieval"] },
  { matcher: /reggio|montessori|guided/i, ids: ["guided-curiosity"] },
  { matcher: /media.literacy|inquiry|verification|critical/i, ids: ["lateral-source-evaluation"] },
  { matcher: /computational|coding|algorithm/i, ids: ["ai-literacy-cocreation"] },
  { matcher: /human..?tool|prompt|robot.chef/i, ids: ["ai-literacy-cocreation"] },
  { matcher: /growth.mindset/i, ids: ["metacognitive-self-direction"] },
  { matcher: /yoga|pranayama|mindfulness/i, ids: ["emotional-resilience"] },
  { matcher: /socratic|philosophy/i, ids: ["ethical-judgment"] },
  { matcher: /perspective|nunchi/i, ids: ["social-attunement"] },
  { matcher: /shinrin|forest/i, ids: ["guided-curiosity"] },
];

/**
 * Compute the set of AI-age competencies an Activity develops, based on its
 * intelligences, method, skillTags and mechanismTags. Pure function, stable
 * across calls.
 */
export function inferCompetencyTags(act: Pick<Activity,
  "intelligences" | "method" | "skillTags" | "mechanismTags" | "duration" | "ageTiers" | "competencyTags"
>): AIAgeCompetencyId[] {
  // Author override always wins.
  if (act.competencyTags && act.competencyTags.length > 0) {
    return act.competencyTags.filter(isAIAgeCompetencyId);
  }

  const out = new Set<AIAgeCompetencyId>();

  for (const intel of act.intelligences) {
    const mapped = INTEL_TO_COMPETENCIES[intel];
    if (mapped) mapped.forEach((c) => out.add(c));
  }

  for (const rule of METHOD_TO_COMPETENCIES) {
    if (rule.matcher.test(act.method)) rule.ids.forEach((c) => out.add(c));
  }

  if (act.skillTags?.includes("ai-literacy")) {
    out.add("ai-literacy-cocreation");
    // Almost every "ai-literacy" activity in our catalogue also hits
    // verification-style thinking; mark lateral evaluation when the kid is
    // old enough to make sense of source-checking (tier ≥ 3 ≈ age 5+).
    if (act.ageTiers.some((t) => t >= 3)) out.add("lateral-source-evaluation");
  }

  if (act.mechanismTags?.includes("retrieval-practice")) {
    out.add("deep-knowledge-retrieval");
  }
  if (act.mechanismTags?.includes("verification-habits")) {
    out.add("lateral-source-evaluation");
  }
  if (act.mechanismTags?.includes("co-regulation")) {
    out.add("social-attunement");
  }
  if (act.mechanismTags?.includes("stress-regulation")) {
    out.add("emotional-resilience");
  }

  // Long-horizon agency is only credibly trained by activities that take
  // real time. Tag anything ≥ 25 minutes that involves Executive Function
  // OR uses a project-style method.
  if (act.duration >= 25 && (act.intelligences.includes("Executive Function") || /project|simulation|build|construct|interview/i.test(act.method))) {
    out.add("long-horizon-agency");
  }

  // Every activity exercises some EF. We only credit it when EF or a strong
  // proxy is explicitly listed (above) to keep the signal honest.

  return [...out];
}

function isAIAgeCompetencyId(value: string): value is AIAgeCompetencyId {
  return (AI_AGE_COMPETENCY_IDS as readonly string[]).includes(value);
}

// ----------------------------------------------------------------------------
// SCORING — converting a logged activity into competency score deltas
// ----------------------------------------------------------------------------

/**
 * +1 per competency tagged on the activity, weighted by engagement.
 * Engagement 1 → 0.5×, 5 → 1.5×. Capped to keep any single session from
 * dominating the rolling profile.
 */
export function competencyDeltasFromLog(input: {
  competencyTags: AIAgeCompetencyId[];
  engagementRating: number;
  completed: boolean;
}): Partial<Record<AIAgeCompetencyId, number>> {
  if (!input.completed) return {};
  const eng = clamp(input.engagementRating, 1, 5);
  const weight = 0.5 + (eng - 1) * 0.25; // 0.5 .. 1.5
  const delta: Partial<Record<AIAgeCompetencyId, number>> = {};
  for (const id of input.competencyTags) {
    delta[id] = (delta[id] ?? 0) + weight;
  }
  return delta;
}

/**
 * Apply competency score deltas immutably, clamping to a 0..MAX scale so that
 * UI percentage rendering is stable. MAX matches the brain-region cap (20).
 */
export const COMPETENCY_SCORE_MAX = 20;

export function applyCompetencyDeltas(
  current: Record<string, number> | undefined,
  delta: Partial<Record<AIAgeCompetencyId, number>>,
): Record<string, number> {
  const next = { ...(current ?? {}) };
  for (const [id, d] of Object.entries(delta)) {
    if (typeof d !== "number") continue;
    next[id] = clamp((next[id] ?? 0) + d, 0, COMPETENCY_SCORE_MAX);
  }
  return next;
}

/**
 * Pick the N weakest competencies (those with the lowest current score).
 * Ties broken by canonical ordering in `AI_AGE_COMPETENCY_IDS` so
 * recommendations are stable across re-renders. Used by the recommendation
 * engine to gently boost activities that develop currently-neglected
 * dimensions.
 */
export function pickPriorityCompetencies(
  scores: Record<string, number> | undefined,
  count = 2,
): AIAgeCompetencyId[] {
  const safe = scores ?? {};
  return [...AI_AGE_COMPETENCY_IDS]
    .map((id) => ({ id, score: safe[id] ?? 0 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, Math.max(0, count))
    .map((entry) => entry.id);
}

export function getCompetencyPercent(score: number | undefined): number {
  const s = clamp(score ?? 0, 0, COMPETENCY_SCORE_MAX);
  return Math.round((s / COMPETENCY_SCORE_MAX) * 100);
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Reference scoring function for the AI-Age Standard.
 *
 * `scoreInteraction` takes a single interaction (transcript + observed
 * behaviours + age + duration + modality) and returns a per-competency
 * delta. It's deliberately simple, deterministic, and fully open so any
 * third party (Khanmigo, Lovevery, Roblox Edu, a daycare, a pediatrician)
 * can reproduce results without calling our servers.
 *
 * It's intentionally NOT an ML model. The standard's value is the
 * **rubric**, not the algorithm. Vendors free to ship richer scorers.
 */
// Import the spec directly (NOT through ./index) to avoid a circular import:
// index.ts imports score.ts; if score.ts imported AI_AGE_COMPETENCIES from
// index.ts, the constant would be undefined at module-init time.
import spec from "./spec.json";
type AIAgeCompetencyId = string;
const AI_AGE_COMPETENCIES = (spec as unknown as { competencies: Array<{ id: string; observableBehaviours: string[]; ageGuidance: Array<{ ageRangeMonths: [number, number]; note: string }> }> }).competencies;
export type { AIAgeCompetencyId };

export interface ScoreInput {
  /** Child age in months. Used to clamp out-of-range competencies. */
  ageMonths: number;
  /** Interaction duration in seconds. Diminishing returns above 600s. */
  durationSec: number;
  /** Modality of the interaction. */
  modality: "voice" | "screen" | "tactile" | "audio-only" | "outdoor" | "mixed";
  /** Optional transcript — array of {from, text} turns. Light keyword scoring only. */
  transcript?: Array<{ from: "child" | "adult" | "ai"; text: string }>;
  /** Observed behaviours from the spec's `observableBehaviours[]`. */
  observed: string[];
  /** Optional explicit competency tags assigned by the partner. */
  explicitCompetencies?: AIAgeCompetencyId[];
}

export type ScoreDelta = Record<AIAgeCompetencyId, number>;

const DURATION_CAP_SEC = 600;

function ageBoost(competencyId: AIAgeCompetencyId, ageMonths: number): number {
  const c = AI_AGE_COMPETENCIES.find((x) => x.id === competencyId);
  if (!c) return 0;
  const inRange = c.ageGuidance.some(
    (g) => ageMonths >= g.ageRangeMonths[0] && ageMonths <= g.ageRangeMonths[1],
  );
  return inRange ? 1.0 : 0.4;
}

function modalityMultiplier(competencyId: AIAgeCompetencyId, modality: ScoreInput["modality"]): number {
  // Embodied + emotional reg amplified by tactile / outdoor; AI literacy by screen/voice.
  if (competencyId === "embodied-mastery") {
    if (modality === "tactile" || modality === "outdoor") return 1.3;
    if (modality === "screen") return 0.6;
  }
  if (competencyId === "ai-literacy-cocreation") {
    if (modality === "screen" || modality === "voice") return 1.2;
    if (modality === "audio-only") return 1.1;
  }
  if (competencyId === "social-attunement" || competencyId === "emotional-resilience") {
    if (modality === "voice" || modality === "outdoor" || modality === "tactile") return 1.2;
  }
  if (competencyId === "deep-knowledge-retrieval") {
    if (modality === "audio-only" || modality === "voice") return 1.1;
  }
  return 1.0;
}

function durationFactor(durationSec: number): number {
  if (durationSec <= 0) return 0;
  // Sublinear: 60s ~ 0.42, 240s ~ 0.78, 600s ~ 1.0
  return Math.min(1.0, Math.sqrt(durationSec / DURATION_CAP_SEC));
}

function transcriptHits(transcript: ScoreInput["transcript"]): Partial<Record<AIAgeCompetencyId, number>> {
  if (!transcript?.length) return {};
  const txt = transcript.map((t) => t.text.toLowerCase()).join(" ");
  const hits: Partial<Record<AIAgeCompetencyId, number>> = {};
  const bump = (id: AIAgeCompetencyId, n: number) => {
    hits[id] = (hits[id] ?? 0) + n;
  };
  // Light bag-of-cues — deliberately conservative so partners can't game it.
  if (/how do you know|how do we know|why do you think/.test(txt)) {
    bump("metacognitive-self-direction", 1);
    bump("guided-curiosity", 0.5);
  }
  if (/i don'?t know|let me check|let me try|i'?m not sure/.test(txt)) {
    bump("metacognitive-self-direction", 0.7);
  }
  if (/what if|i wonder|what do you think happens/.test(txt)) {
    bump("guided-curiosity", 1);
    bump("creative-generation", 0.4);
  }
  if (/feel|feeling|sad|happy|angry|frustrated|calm down|deep breath/.test(txt)) {
    bump("emotional-resilience", 1);
    bump("social-attunement", 0.4);
  }
  if (/fair|unfair|that'?s not right|share/.test(txt)) {
    bump("ethical-judgment", 1);
    bump("social-attunement", 0.3);
  }
  return hits;
}

const OBSERVED_TO_COMP: Record<string, AIAgeCompetencyId> = {};
for (const c of AI_AGE_COMPETENCIES) {
  for (const b of c.observableBehaviours) OBSERVED_TO_COMP[b] = c.id;
}

export function scoreInteraction(input: ScoreInput): ScoreDelta {
  const delta = {} as ScoreDelta;
  for (const c of AI_AGE_COMPETENCIES) delta[c.id] = 0;

  // 1. Observed behaviours map directly into their parent competency.
  for (const b of input.observed) {
    const id = OBSERVED_TO_COMP[b];
    if (id) delta[id] += 1.5;
  }
  // 2. Partner-asserted explicit tags.
  for (const id of input.explicitCompetencies ?? []) delta[id] += 1.0;
  // 3. Light transcript cues.
  const t = transcriptHits(input.transcript);
  for (const [id, n] of Object.entries(t)) delta[id as AIAgeCompetencyId] += n!;
  // 4. Apply duration, modality, age clamps.
  const d = durationFactor(input.durationSec);
  for (const c of AI_AGE_COMPETENCIES) {
    delta[c.id] *= d * modalityMultiplier(c.id, input.modality) * ageBoost(c.id, input.ageMonths);
    delta[c.id] = Math.round(delta[c.id] * 100) / 100;
  }
  return delta;
}

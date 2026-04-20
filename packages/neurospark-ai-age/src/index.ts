/**
 * @neurospark/ai-age — Open AI-Age Competency Standard
 *
 * Re-exports the spec + scoring utilities. Versioned via package.json `version`.
 * The spec is the source of truth; everything else is a derivation.
 */
import spec from "./spec.json";

export interface AIAgeCompetencyV1 {
  id: string;
  label: string;
  shortLabel: string;
  category: "foundational" | "knowledge-mechanics" | "ai-era" | "human-moat";
  definition: string;
  whyAIAge: string;
  ageGuidance: { ageRangeMonths: [number, number]; note: string }[];
  observableBehaviours: string[];
  evidence: { citation: string; doi?: string; url?: string }[];
}

export interface AIAgeStandardSpec {
  version: string;
  publishedAt: string;
  governance: {
    license: "MIT";
    body: string;
    breakingChangeWindowDays: number;
  };
  competencies: AIAgeCompetencyV1[];
}

export const AI_AGE_STANDARD: AIAgeStandardSpec = spec as unknown as AIAgeStandardSpec;
export const AI_AGE_COMPETENCIES: readonly AIAgeCompetencyV1[] = AI_AGE_STANDARD.competencies;
export const AI_AGE_COMPETENCY_IDS: readonly string[] = AI_AGE_COMPETENCIES.map((c) => c.id);

export type AIAgeCompetencyId = (typeof AI_AGE_COMPETENCY_IDS)[number];

export { scoreInteraction, type ScoreInput, type ScoreDelta } from "./score";

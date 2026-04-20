/**
 * Sleep × Cognition Loop — Survivor 4.
 *
 * Tiny, dependency-free domain module that:
 *   - Defines the 4-bucket sleep signal taxonomy (excellent / adequate / short / deficient)
 *   - Computes the bucket from a {minutes, age} pair (client-side; we never upload raw)
 *   - Computes a `sleepDebtFactor` for the AGE so adaptation can throttle
 *     working-memory-loaded activities the morning after a poor night.
 *
 * Citations:
 *   - ABCD cohort (2025): insufficient sleep mediates ~10.9% of sleep's
 *     effect on crystallised IQ + episodic memory in ~6,800 kids.
 *   - Frontiers Hum. Neurosci. (2025): reduced ALPS index in ADHD predicts
 *     language delay.
 *   - AAP recommendations: 0-2y 11-14h, 3-5y 10-13h, 6-12y 9-12h.
 */

export type SleepBucket = "excellent" | "adequate" | "short" | "deficient";
export type SleepSource = "healthkit" | "health-connect" | "fitbit" | "oura" | "manual" | "imported";

export interface SleepNight {
  childId: string;
  /** Calendar date the night ended, ISO YYYY-MM-DD in the child's local timezone. */
  nightDate: string;
  bucket: SleepBucket;
  source: SleepSource;
}

export interface SleepRangeRecommendation {
  minHours: number;
  maxHours: number;
}

/** AAP-aligned recommended sleep ranges by age in months. */
export function recommendedSleepHours(ageMonths: number): SleepRangeRecommendation {
  if (ageMonths < 36) return { minHours: 11, maxHours: 14 };
  if (ageMonths < 72) return { minHours: 10, maxHours: 13 };
  return { minHours: 9, maxHours: 12 };
}

/**
 * Map a measured number of minutes slept (and optional awakenings) onto the
 * 4-bucket taxonomy, given a child's age. Inputs that are clearly broken
 * (e.g. 0 minutes) bucket to "deficient" so AGE always has a signal.
 */
export function bucketFromMinutes(
  minutesSlept: number,
  ageMonths: number,
  options?: { awakenings?: number },
): SleepBucket {
  const { minHours, maxHours } = recommendedSleepHours(ageMonths);
  const minutes = Math.max(0, Math.round(minutesSlept));
  const minMins = minHours * 60;
  const maxMins = maxHours * 60;
  const awakenings = options?.awakenings ?? 0;
  if (minutes >= minMins && minutes <= maxMins && awakenings <= 1) return "excellent";
  if (minutes >= minMins - 30 && minutes <= maxMins + 60) return "adequate";
  if (minutes >= minMins - 90) return "short";
  return "deficient";
}

const BUCKET_DEBT: Record<SleepBucket, number> = {
  excellent: 0,
  adequate: 0,
  short: 0.4,
  deficient: 1.0,
};

/**
 * 7-day exponentially-weighted sleep-debt score in [0, 1]. The most recent
 * night carries the most weight (decay 0.7). 1.0 → today's plan should be
 * meaningfully lighter; 0 → no adjustment needed.
 */
export function sleepDebtFactor(recent: SleepNight[]): number {
  if (!recent.length) return 0;
  const sorted = [...recent].sort((a, b) => b.nightDate.localeCompare(a.nightDate)).slice(0, 7);
  let weighted = 0;
  let totalWeight = 0;
  let weight = 1;
  for (const night of sorted) {
    weighted += BUCKET_DEBT[night.bucket] * weight;
    totalWeight += weight;
    weight *= 0.7;
  }
  return Math.min(1, weighted / Math.max(0.0001, totalWeight));
}

/**
 * Multiplier applied to working-memory-loaded activity scoring in `runAGE`
 * when the child is sleep-debted. 1.0 = no change; <1 = de-prioritise.
 *
 * factor=0 → mul=1.0; factor=0.4 → mul=0.94; factor=1.0 → mul=0.85.
 */
export function workingMemoryMultiplierFromDebt(factor: number): number {
  const clamped = Math.max(0, Math.min(1, factor));
  return 1.0 - clamped * 0.15;
}

/** Brain regions whose activities are most working-memory-loaded. */
export const WORKING_MEMORY_HEAVY_REGIONS: readonly string[] = [
  "Logical-Mathematical",
  "Linguistic",
  "Spatial-Visual",
  "Digital-Technological",
];

/**
 * Should we surface the bedtime co-regulation routine on Home today?
 * True if the most recent night was short or deficient.
 */
export function shouldSurfaceBedtimeRoutine(recent: SleepNight[]): boolean {
  if (!recent.length) return false;
  const latest = recent.reduce((a, b) => (a.nightDate >= b.nightDate ? a : b));
  return latest.bucket === "short" || latest.bucket === "deficient";
}

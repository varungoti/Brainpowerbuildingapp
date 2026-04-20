import type { ActivityLog, AdaptiveModel, AdaptiveRegionRecommendation } from "../../app/context/AppContext";
import { AI_AGE_COMPETENCIES, type AIAgeCompetencyId } from "../competencies/aiAgeCompetencies";

const MIN_SAMPLES = 3;
const DEFAULT_WEIGHT = 1.0;

export function createEmptyModel(): AdaptiveModel {
  return {
    regionWeights: {},
    recommendations: {},
    competencyWeights: {},
    lastTrainedAt: new Date().toISOString(),
    version: 1,
  };
}

interface RegionStats {
  totalEngagement: number;
  totalCompletion: number;
  count: number;
  avgDifficulty: number;
}

function aggregateByRegion(logs: ActivityLog[]): Record<string, RegionStats> {
  const byRegion: Record<string, RegionStats> = {};
  for (const log of logs) {
    if (!log.completed) continue;
    const r = log.region;
    if (!byRegion[r]) byRegion[r] = { totalEngagement: 0, totalCompletion: 0, count: 0, avgDifficulty: 0 };
    byRegion[r].totalEngagement += log.engagementRating;
    byRegion[r].totalCompletion += 1;
    byRegion[r].count += 1;
    byRegion[r].avgDifficulty += (log.difficultyTier ?? 2);
  }
  for (const stats of Object.values(byRegion)) {
    if (stats.count > 0) stats.avgDifficulty /= stats.count;
  }
  return byRegion;
}

function computeRecommendedTier(avgEngagement: number, avgDifficulty: number): 1 | 2 | 3 {
  if (avgEngagement >= 4.0 && avgDifficulty <= 2) return 3;
  if (avgEngagement >= 3.0) return 2;
  return 1;
}

export function trainFromLogs(logs: ActivityLog[], existing?: AdaptiveModel | null): AdaptiveModel {
  const model = existing ? { ...existing } : createEmptyModel();
  const byRegion = aggregateByRegion(logs);

  const newWeights: Record<string, number> = {};
  const newRecs: Record<string, AdaptiveRegionRecommendation> = {};

  for (const [region, stats] of Object.entries(byRegion)) {
    const avgEng = stats.totalEngagement / stats.count;
    const weight = avgEng >= 4 ? 1.3 : avgEng >= 3 ? 1.0 : 0.7;
    newWeights[region] = weight;

    if (stats.count >= MIN_SAMPLES) {
      newRecs[region] = {
        recommendedTier: computeRecommendedTier(avgEng, stats.avgDifficulty),
        confidenceScore: Math.min(stats.count / 10, 1.0),
        sampleCount: stats.count,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  model.regionWeights = { ...model.regionWeights, ...newWeights };
  model.recommendations = { ...model.recommendations, ...newRecs };
  model.competencyWeights = { ...(model.competencyWeights ?? {}), ...trainCompetencyWeights(logs) };
  model.lastTrainedAt = new Date().toISOString();
  model.version += 1;
  return model;
}

export function getAdaptiveScoreBonus(activityRegion: string, difficulty: number, model: AdaptiveModel | null): number {
  if (!model) return 0;
  const weight = model.regionWeights[activityRegion] ?? DEFAULT_WEIGHT;
  const rec = model.recommendations[activityRegion];
  let bonus = (weight - 1.0) * 15;
  if (rec) {
    const tierMatch = Math.abs(difficulty - rec.recommendedTier);
    bonus += (3 - tierMatch) * 5 * rec.confidenceScore;
  }
  return Math.round(bonus);
}

// ─── Phase D — competencyWeights ─────────────────────────────────────────────
// Aggregates engagement per competency tag observed in the training logs
// (we re-resolve tags on the log itself so we don't need to re-run the
// inference pipeline). Weights are clamped to [0.7, 1.3] so a single bad
// session never tanks a dimension.
// ----------------------------------------------------------------------------
type LogWithTags = ActivityLog & { competencyTags?: string[] };

function trainCompetencyWeights(logs: ActivityLog[]): Record<string, number> {
  const totals: Record<string, { eng: number; n: number }> = {};
  for (const log of logs) {
    if (!log.completed) continue;
    const tags = (log as LogWithTags).competencyTags;
    if (!tags || tags.length === 0) continue;
    for (const tag of tags) {
      if (!totals[tag]) totals[tag] = { eng: 0, n: 0 };
      totals[tag].eng += log.engagementRating;
      totals[tag].n += 1;
    }
  }
  const out: Record<string, number> = {};
  for (const c of AI_AGE_COMPETENCIES) {
    const t = totals[c.id];
    if (!t || t.n < MIN_SAMPLES) continue;
    const avg = t.eng / t.n;
    const weight = avg >= 4 ? 1.3 : avg >= 3 ? 1.0 : 0.7;
    out[c.id] = weight;
  }
  return out;
}

/**
 * Returns a small score nudge for an activity based on its competency tags.
 * Positive when the child engages above-average with that competency,
 * negative when consistently disengaged. Centred at 0.
 */
export function getAdaptiveCompetencyBonus(
  competencyTags: AIAgeCompetencyId[] | undefined,
  model: AdaptiveModel | null,
): number {
  if (!model || !competencyTags || competencyTags.length === 0) return 0;
  const weights = model.competencyWeights ?? {};
  let sum = 0;
  let count = 0;
  for (const tag of competencyTags) {
    const w = weights[tag];
    if (typeof w === "number") {
      sum += w - 1.0;
      count += 1;
    }
  }
  if (count === 0) return 0;
  return Math.round((sum / count) * 12);
}

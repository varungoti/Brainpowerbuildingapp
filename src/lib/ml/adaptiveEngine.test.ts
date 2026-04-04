import { describe, it, expect } from "vitest";
import type { ActivityLog, AdaptiveModel } from "../../app/context/AppContext";
import {
  createEmptyModel,
  trainFromLogs,
  getAdaptiveScoreBonus,
} from "./adaptiveEngine";

function baseLog(overrides: Partial<ActivityLog>): ActivityLog {
  return {
    id: "log-1",
    childId: "child-1",
    activityId: "act-1",
    activityName: "Test",
    emoji: "🧠",
    date: new Date().toISOString(),
    intelligences: ["Linguistic"],
    method: "Test",
    region: "Frontal",
    regionEmoji: "🎯",
    duration: 10,
    completed: true,
    engagementRating: 4,
    parentNotes: "",
    brainPointsEarned: 5,
    ...overrides,
  };
}

describe("createEmptyModel", () => {
  it("returns a valid AdaptiveModel structure", () => {
    const m = createEmptyModel();
    expect(m.regionWeights).toEqual({});
    expect(m.recommendations).toEqual({});
    expect(m.version).toBe(1);
    expect(typeof m.lastTrainedAt).toBe("string");
    expect(() => new Date(m.lastTrainedAt).getTime()).not.toThrow();
    expect(Number.isNaN(new Date(m.lastTrainedAt).getTime())).toBe(false);
  });
});

describe("trainFromLogs", () => {
  it("computes region weights from completed logs", () => {
    const logs: ActivityLog[] = [
      baseLog({ id: "a", region: "Temporal", engagementRating: 5 }),
      baseLog({ id: "b", region: "Temporal", engagementRating: 5 }),
      baseLog({ id: "c", region: "Temporal", engagementRating: 5 }),
    ];
    const model = trainFromLogs(logs);
    expect(model.regionWeights.Temporal).toBe(1.3);
  });

  it("adds recommendations when a region has at least 3 samples", () => {
    const logs: ActivityLog[] = [
      baseLog({
        id: "1",
        region: "Parietal",
        engagementRating: 5,
        difficultyTier: 2,
      }),
      baseLog({
        id: "2",
        region: "Parietal",
        engagementRating: 5,
        difficultyTier: 2,
      }),
      baseLog({
        id: "3",
        region: "Parietal",
        engagementRating: 5,
        difficultyTier: 2,
      }),
    ];
    const model = trainFromLogs(logs);
    expect(model.recommendations.Parietal).toBeDefined();
    expect(model.recommendations.Parietal!.recommendedTier).toBe(3);
    expect(model.recommendations.Parietal!.sampleCount).toBe(3);
    expect(model.recommendations.Parietal!.confidenceScore).toBeCloseTo(0.3, 5);
  });

  it("merges into an existing model and bumps version", () => {
    const existing: AdaptiveModel = {
      regionWeights: { Occipital: 0.7 },
      recommendations: {},
      lastTrainedAt: "2020-01-01T00:00:00.000Z",
      version: 5,
    };
    const logs: ActivityLog[] = [
      baseLog({ id: "a", region: "Occipital", engagementRating: 4 }),
      baseLog({ id: "b", region: "Occipital", engagementRating: 4 }),
      baseLog({ id: "c", region: "Occipital", engagementRating: 4 }),
    ];
    const model = trainFromLogs(logs, existing);
    expect(model.version).toBe(6);
    expect(model.regionWeights.Occipital).toBe(1.3);
  });
});

describe("getAdaptiveScoreBonus", () => {
  it("returns 0 when model is null", () => {
    expect(getAdaptiveScoreBonus("Frontal", 2, null)).toBe(0);
  });

  it("uses default weight 1.0 for unknown regions (bonus 0 without rec)", () => {
    const model = createEmptyModel();
    expect(getAdaptiveScoreBonus("UnknownRegion", 2, model)).toBe(0);
  });

  it("returns a positive bonus for high-weight regions with matching tier", () => {
    const model: AdaptiveModel = {
      regionWeights: { Limbic: 1.3 },
      recommendations: {
        Limbic: {
          recommendedTier: 2,
          confidenceScore: 1,
          sampleCount: 10,
          lastUpdated: new Date().toISOString(),
        },
      },
      lastTrainedAt: new Date().toISOString(),
      version: 2,
    };
    const bonus = getAdaptiveScoreBonus("Limbic", 2, model);
    expect(bonus).toBeGreaterThan(0);
  });
});

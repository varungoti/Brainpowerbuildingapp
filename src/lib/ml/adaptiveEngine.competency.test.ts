import { describe, it, expect } from "vitest";
import { trainFromLogs, getAdaptiveCompetencyBonus, createEmptyModel } from "./adaptiveEngine";
import type { ActivityLog } from "../../app/context/AppContext";
import type { AIAgeCompetencyId } from "../competencies/aiAgeCompetencies";

function makeLog(partial: Partial<ActivityLog>): ActivityLog {
  return {
    id: Math.random().toString(36).slice(2),
    childId: "c1",
    activityId: "a1",
    activityName: "Activity",
    emoji: "🧠",
    date: new Date().toISOString(),
    intelligences: ["analytical-engineering"],
    method: "Forest Play",
    region: "frontal_cortex",
    regionEmoji: "🧠",
    duration: 15,
    completed: true,
    engagementRating: 4,
    parentNotes: "",
    brainPointsEarned: 50,
    difficultyTier: 2,
    competencyTags: ["creative-generation"],
    ...partial,
  };
}

describe("Phase D — competencyWeights training", () => {
  it("createEmptyModel includes empty competencyWeights", () => {
    const m = createEmptyModel();
    expect(m.competencyWeights).toEqual({});
  });

  it("does not learn weights with fewer than MIN_SAMPLES", () => {
    const logs = [makeLog({ competencyTags: ["creative-generation"], engagementRating: 5 })];
    const model = trainFromLogs(logs);
    expect(model.competencyWeights?.["creative-generation"]).toBeUndefined();
  });

  it("learns a high weight for high-engagement competencies", () => {
    const logs = Array.from({ length: 4 }, () =>
      makeLog({ competencyTags: ["creative-generation"], engagementRating: 5 }),
    );
    const model = trainFromLogs(logs);
    expect(model.competencyWeights?.["creative-generation"]).toBe(1.3);
  });

  it("learns a low weight for low-engagement competencies", () => {
    const logs = Array.from({ length: 5 }, () =>
      makeLog({ competencyTags: ["ethical-judgment"], engagementRating: 2 }),
    );
    const model = trainFromLogs(logs);
    expect(model.competencyWeights?.["ethical-judgment"]).toBe(0.7);
  });

  it("getAdaptiveCompetencyBonus returns 0 when model is null or no tags", () => {
    expect(getAdaptiveCompetencyBonus(undefined, null)).toBe(0);
    expect(getAdaptiveCompetencyBonus([], createEmptyModel())).toBe(0);
  });

  it("getAdaptiveCompetencyBonus produces positive nudge for engaged competencies", () => {
    const logs = Array.from({ length: 4 }, () =>
      makeLog({ competencyTags: ["creative-generation"], engagementRating: 5 }),
    );
    const model = trainFromLogs(logs);
    const tags: AIAgeCompetencyId[] = ["creative-generation"];
    expect(getAdaptiveCompetencyBonus(tags, model)).toBeGreaterThan(0);
  });

  it("getAdaptiveCompetencyBonus produces negative nudge for disengaged competencies", () => {
    const logs = Array.from({ length: 4 }, () =>
      makeLog({ competencyTags: ["ethical-judgment"], engagementRating: 2 }),
    );
    const model = trainFromLogs(logs);
    expect(getAdaptiveCompetencyBonus(["ethical-judgment"], model)).toBeLessThan(0);
  });
});

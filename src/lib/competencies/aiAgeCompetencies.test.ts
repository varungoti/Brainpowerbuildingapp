import { describe, expect, it } from "vitest";
import {
  AI_AGE_COMPETENCIES,
  AI_AGE_COMPETENCY_IDS,
  applyCompetencyDeltas,
  competencyDeltasFromLog,
  COMPETENCY_SCORE_MAX,
  getCompetency,
  getCompetencyPercent,
  inferCompetencyTags,
  pickPriorityCompetencies,
  type AIAgeCompetencyId,
} from "./aiAgeCompetencies";

describe("AI-Age Readiness — competency framework", () => {
  describe("registry integrity", () => {
    it("has exactly twelve competencies, all with unique ids", () => {
      expect(AI_AGE_COMPETENCIES).toHaveLength(12);
      const ids = AI_AGE_COMPETENCIES.map((c) => c.id);
      expect(new Set(ids).size).toBe(12);
      expect(ids).toEqual([...AI_AGE_COMPETENCY_IDS]);
    });

    it("every competency carries definition, AI-age rationale, and at least one citation", () => {
      for (const c of AI_AGE_COMPETENCIES) {
        expect(c.definition.length).toBeGreaterThan(20);
        expect(c.whyAIAge.length).toBeGreaterThan(20);
        expect(c.evidence.length).toBeGreaterThan(0);
      }
    });

    it("getCompetency resolves any registered id", () => {
      for (const id of AI_AGE_COMPETENCY_IDS) {
        expect(getCompetency(id).id).toBe(id);
      }
    });
  });

  describe("inferCompetencyTags — heuristic from existing Activity fields", () => {
    it("respects an explicit author override", () => {
      const tags = inferCompetencyTags({
        intelligences: ["Naturalist"],
        method: "anything",
        skillTags: undefined,
        mechanismTags: undefined,
        duration: 10,
        ageTiers: [2],
        competencyTags: ["ethical-judgment"],
      });
      expect(tags).toEqual(["ethical-judgment"]);
    });

    it("ignores unknown ids in an author override", () => {
      const tags = inferCompetencyTags({
        intelligences: [],
        method: "",
        skillTags: undefined,
        mechanismTags: undefined,
        duration: 5,
        ageTiers: [1],
        competencyTags: ["ethical-judgment", "not-a-real-id" as AIAgeCompetencyId],
      });
      expect(tags).toEqual(["ethical-judgment"]);
    });

    it("maps Executive Function intelligence to executive-function competency", () => {
      const tags = inferCompetencyTags({
        intelligences: ["Executive Function"],
        method: "Generic",
        skillTags: undefined,
        mechanismTags: undefined,
        duration: 10,
        ageTiers: [3],
        competencyTags: undefined,
      });
      expect(tags).toContain("executive-function");
    });

    it("derives lateral-source-evaluation when ai-literacy skillTag meets age tier ≥ 3", () => {
      const tags = inferCompetencyTags({
        intelligences: ["Linguistic"],
        method: "Media Literacy (unplugged)",
        skillTags: ["ai-literacy"],
        mechanismTags: undefined,
        duration: 15,
        ageTiers: [3],
        competencyTags: undefined,
      });
      expect(tags).toContain("ai-literacy-cocreation");
      expect(tags).toContain("lateral-source-evaluation");
    });

    it("does NOT derive lateral-source-evaluation for younger children", () => {
      const tags = inferCompetencyTags({
        intelligences: ["Linguistic"],
        method: "Story",
        skillTags: ["ai-literacy"],
        mechanismTags: undefined,
        duration: 10,
        ageTiers: [1, 2],
        competencyTags: undefined,
      });
      expect(tags).toContain("ai-literacy-cocreation");
      expect(tags).not.toContain("lateral-source-evaluation");
    });

    it("tags long-horizon-agency only for ≥25 minute Executive Function activities", () => {
      const longEF = inferCompetencyTags({
        intelligences: ["Executive Function"],
        method: "Project-Based Learning",
        skillTags: undefined,
        mechanismTags: undefined,
        duration: 30,
        ageTiers: [4],
        competencyTags: undefined,
      });
      const shortEF = inferCompetencyTags({
        intelligences: ["Executive Function"],
        method: "Game",
        skillTags: undefined,
        mechanismTags: undefined,
        duration: 10,
        ageTiers: [4],
        competencyTags: undefined,
      });
      expect(longEF).toContain("long-horizon-agency");
      expect(shortEF).not.toContain("long-horizon-agency");
    });

    it("derives deep-knowledge-retrieval from spaced-repetition method", () => {
      const tags = inferCompetencyTags({
        intelligences: ["Linguistic"],
        method: "Spaced Repetition",
        skillTags: undefined,
        mechanismTags: ["retrieval-practice"],
        duration: 15,
        ageTiers: [4],
        competencyTags: undefined,
      });
      expect(tags).toContain("deep-knowledge-retrieval");
    });
  });

  describe("competencyDeltasFromLog", () => {
    it("returns no delta for an incomplete log", () => {
      expect(
        competencyDeltasFromLog({
          competencyTags: ["executive-function"],
          engagementRating: 5,
          completed: false,
        }),
      ).toEqual({});
    });

    it("scales with engagement rating between 0.5× and 1.5×", () => {
      const low = competencyDeltasFromLog({
        competencyTags: ["executive-function"],
        engagementRating: 1,
        completed: true,
      });
      const high = competencyDeltasFromLog({
        competencyTags: ["executive-function"],
        engagementRating: 5,
        completed: true,
      });
      expect(low["executive-function"]).toBeCloseTo(0.5, 5);
      expect(high["executive-function"]).toBeCloseTo(1.5, 5);
    });

    it("emits deltas for every tag on the activity", () => {
      const delta = competencyDeltasFromLog({
        competencyTags: ["executive-function", "creative-generation"],
        engagementRating: 3,
        completed: true,
      });
      expect(Object.keys(delta).sort()).toEqual([
        "creative-generation",
        "executive-function",
      ]);
    });
  });

  describe("applyCompetencyDeltas + clamping", () => {
    it("creates a missing key starting from zero", () => {
      const next = applyCompetencyDeltas(undefined, {
        "executive-function": 1.5,
      });
      expect(next["executive-function"]).toBe(1.5);
    });

    it("clamps to COMPETENCY_SCORE_MAX so percentages cap at 100%", () => {
      const next = applyCompetencyDeltas(
        { "executive-function": COMPETENCY_SCORE_MAX - 0.4 },
        { "executive-function": 5 },
      );
      expect(next["executive-function"]).toBe(COMPETENCY_SCORE_MAX);
      expect(getCompetencyPercent(next["executive-function"])).toBe(100);
    });

    it("never mutates the input map", () => {
      const before = { "executive-function": 2 };
      applyCompetencyDeltas(before, { "executive-function": 1 });
      expect(before).toEqual({ "executive-function": 2 });
    });
  });

  describe("pickPriorityCompetencies", () => {
    it("returns the lowest-scored competencies first, defaulting count=2", () => {
      // Set every dimension high except two so the bottom-2 are unambiguous.
      const scores: Record<string, number> = Object.fromEntries(
        AI_AGE_COMPETENCY_IDS.map((id) => [id, 10]),
      );
      scores["creative-generation"] = 0.5;
      scores["metacognitive-self-direction"] = 1;

      const top = pickPriorityCompetencies(scores);
      expect(top.length).toBe(2);
      expect(top[0]).toBe("creative-generation");
      expect(top[1]).toBe("metacognitive-self-direction");
    });

    it("treats undefined scores as zero (highest priority) and stays stable", () => {
      const top = pickPriorityCompetencies(undefined, 3);
      expect(top.length).toBe(3);
      // First three are the canonical first three ids when all scores tie at 0.
      expect(top).toEqual([
        AI_AGE_COMPETENCY_IDS[0],
        AI_AGE_COMPETENCY_IDS[1],
        AI_AGE_COMPETENCY_IDS[2],
      ]);
    });

    it("clamps count to non-negative", () => {
      expect(pickPriorityCompetencies({}, -3)).toEqual([]);
    });
  });
});

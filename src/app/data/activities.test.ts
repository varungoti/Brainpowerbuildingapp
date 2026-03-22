import { describe, it, expect, vi, afterEach } from "vitest";
import {
  ACTIVITIES,
  buildLastCompletionMap,
  spacedRepetitionScoreBonus,
  personalizationScoreBonus,
  runAGE,
  SKILL_TAG_AI_LITERACY,
  type AGEPersonalization,
} from "./activities";

describe("buildLastCompletionMap", () => {
  it("keeps latest completion per activity", () => {
    const map = buildLastCompletionMap(
      [
        { childId: "c1", activityId: "a01", completed: true, date: "2026-01-01T10:00:00Z" },
        { childId: "c1", activityId: "a01", completed: true, date: "2026-01-05T10:00:00Z" },
        { childId: "c1", activityId: "a02", completed: true, date: "2026-01-03T10:00:00Z" },
        { childId: "c2", activityId: "a01", completed: true, date: "2026-01-10T10:00:00Z" },
        { childId: "c1", activityId: "a03", completed: false, date: "2026-01-10T10:00:00Z" },
      ],
      "c1",
    );
    expect(Object.keys(map).sort()).toEqual(["a01", "a02"]);
    expect(map.a01).toBe(new Date("2026-01-05T10:00:00Z").getTime());
    expect(map.a02).toBe(new Date("2026-01-03T10:00:00Z").getTime());
  });
});

describe("spacedRepetitionScoreBonus", () => {
  const now = new Date("2026-03-19T12:00:00Z").getTime();

  it("penalizes repeats within 24h", () => {
    const last = now - 5 * 60 * 60 * 1000;
    expect(spacedRepetitionScoreBonus("a01", { a01: last }, now)).toBeLessThan(0);
  });

  it("boosts 3–7 day spacing", () => {
    const last = now - 5 * 24 * 60 * 60 * 1000;
    expect(spacedRepetitionScoreBonus("a01", { a01: last }, now)).toBe(16);
  });

  it("treats never-done as mild novelty", () => {
    expect(spacedRepetitionScoreBonus("a99", {}, now)).toBe(5);
  });
});

describe("personalizationScoreBonus", () => {
  const baseP: AGEPersonalization = {
    learningStyle: null,
    curiosity: 5,
    energy: 5,
    patience: 5,
    creativity: 5,
    social: 5,
    energyLevel: 5,
    adaptability: 5,
    mood: 5,
    sensitivity: 5,
  };

  it("never exceeds cap", () => {
    const heavy: AGEPersonalization = {
      ...baseP,
      learningStyle: "visual",
      creativity: 10,
      social: 10,
      curiosity: 10,
      energy: 10,
      energyLevel: 10,
      sensitivity: 10,
      patience: 3,
      adaptability: 10,
    };
    const act = ACTIVITIES.find(a => a.id === "a08")!;
    expect(personalizationScoreBonus(act, heavy)).toBeLessThanOrEqual(28);
  });

  it("adds learning-style match for visual + spatial activity", () => {
    const act = ACTIVITIES.find(a => a.id === "a08")!;
    const withStyle = { ...baseP, learningStyle: "visual" as const };
    const without = { ...baseP, learningStyle: null };
    expect(personalizationScoreBonus(act, withStyle)).toBeGreaterThan(personalizationScoreBonus(act, without));
  });
});

describe("runAGE", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns only tier-eligible activities", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const mats = [
      "paper",
      "pencils",
      "cups",
      "bowls",
      "spoons",
      "pots",
      "rice",
      "beans",
      "buttons",
      "stones",
      "eggtray",
      "muffin",
      "blanket",
      "tape",
      "ruler",
      "water",
      "outdoor",
      "torch",
      "leaves",
      "bottlecap",
    ];
    const pack = runAGE(5, mats, "focus", 120, [], null, null, null);
    expect(pack.length).toBeGreaterThan(0);
    for (const a of pack) {
      expect(a.ageTiers).toContain(5);
    }
  });

  it("respects 24h exclusion when history map is non-empty", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const mats = [
      "paper",
      "pencils",
      "cups",
      "bowls",
      "spoons",
      "pots",
      "rice",
      "beans",
      "buttons",
      "stones",
      "eggtray",
      "muffin",
      "blanket",
      "tape",
      "ruler",
      "water",
      "outdoor",
      "torch",
      "leaves",
      "bottlecap",
    ];
    const justNow = Date.now();
    const recent: Record<string, number> = {};
    for (const a of ACTIVITIES) {
      if (a.ageTiers.includes(5)) {
        recent[a.id] = justNow;
        break;
      }
    }
    const punishedId = Object.keys(recent)[0];
    const pack = runAGE(5, mats, "focus", 120, [], null, recent, null);
    expect(pack.every(a => a.id !== punishedId)).toBe(true);
  });

  it("with boostAILiteracy includes at least one ai-literacy activity when tier allows", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const mats = [
      "paper",
      "pencils",
      "cups",
      "bowls",
      "spoons",
      "pots",
      "rice",
      "beans",
      "buttons",
      "stones",
      "eggtray",
      "muffin",
      "blanket",
      "tape",
      "ruler",
      "water",
      "outdoor",
      "torch",
      "leaves",
      "bottlecap",
    ];
    const pack = runAGE(5, mats, "focus", 120, [], null, null, { boostAILiteracy: true });
    expect(pack.length).toBeGreaterThan(0);
    expect(pack.some(a => a.skillTags?.includes(SKILL_TAG_AI_LITERACY))).toBe(true);
  });

  it("enriches activities with reviewed curriculum metadata", () => {
    const act = ACTIVITIES.find((a) => a.id === "a16")!;
    expect(act.reviewStatus).toBe("reviewed");
    expect(act.goalPillars?.length).toBeGreaterThan(0);
    expect(act.mechanismTags?.length).toBeGreaterThan(0);
    expect(act.durationVariants?.standard).toBe(act.duration);
    expect(act.progression?.programId).toContain("ai-literacy");
  });

  it("can bias toward outcome focus pillars without breaking pack generation", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const mats = [
      "paper",
      "pencils",
      "cups",
      "bowls",
      "spoons",
      "pots",
      "rice",
      "beans",
      "buttons",
      "stones",
      "eggtray",
      "muffin",
      "blanket",
      "tape",
      "ruler",
      "water",
      "outdoor",
      "torch",
      "leaves",
      "bottlecap",
    ];
    const pack = runAGE(4, mats, "focus", 90, [], null, null, { focusPillars: ["Executive"] });
    expect(pack.length).toBeGreaterThan(0);
    expect(pack.some((act) => act.goalPillars?.includes("Executive"))).toBe(true);
  });
});

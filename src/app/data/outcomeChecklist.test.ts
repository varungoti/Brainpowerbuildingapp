import { describe, expect, it } from "vitest";
import { getOutcomeFocusPillars, getOutcomePillarAverages } from "./outcomeChecklist";

describe("outcome checklist adaptive focus", () => {
  it("derives pillar averages from the latest month", () => {
    const averages = getOutcomePillarAverages([
      {
        monthKey: "2026-03",
        submittedAt: "2026-03-19T00:00:00.000Z",
        compositeScore: 3.1,
        answers: {
          attention_focus: 2,
          persistence: 3,
          emotional_regulation: 4,
          curiosity: 5,
          coordination: 3,
          social_coop: 2,
          language_expression: 4,
          patterns_logic: 3,
        },
      },
    ]);

    expect(averages.Executive).toBe(2.5);
    expect(averages.Emotional).toBe(4);
  });

  it("returns low-performing pillars in priority order", () => {
    const focus = getOutcomeFocusPillars([
      {
        monthKey: "2026-03",
        submittedAt: "2026-03-19T00:00:00.000Z",
        compositeScore: 3,
        answers: {
          attention_focus: 2,
          persistence: 2,
          emotional_regulation: 4,
          curiosity: 5,
          coordination: 2,
          social_coop: 2,
          language_expression: 4,
          patterns_logic: 4,
        },
      },
    ]);

    expect(focus[0]).toBe("Executive");
    expect(focus).toContain("Motor-Social");
  });
});

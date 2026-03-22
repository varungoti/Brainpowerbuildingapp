import { describe, expect, it } from "vitest";
import { getExecutableYearPlan, getLinkedWeekActivityIds } from "./yearPlan";

describe("executable year plan", () => {
  it("links week plans to concrete activity ids", () => {
    const plan = getExecutableYearPlan(2);
    const firstWeek = plan.months[0].weeklyPlans[0];
    expect(firstWeek.activityIds).toBeDefined();
    expect((firstWeek.activityIds ?? []).length).toBeGreaterThan(0);
  });

  it("returns stable top matches for a week focus", () => {
    const ids = getLinkedWeekActivityIds(3, {
      week: 1,
      focus: "Rhythm and beat",
      activities: ["Drum imitation", "Body percussion", "March to music"],
    });
    expect(ids.length).toBeGreaterThan(0);
  });
});

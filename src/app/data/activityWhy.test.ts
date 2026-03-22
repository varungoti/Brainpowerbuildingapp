import { describe, it, expect } from "vitest";
import { ACTIVITIES } from "./activities";
import { buildWhyPickedLines } from "./activityWhy";

describe("buildWhyPickedLines", () => {
  it("includes tier summary line", () => {
    const act = ACTIVITIES.find(a => a.id === "a01")!;
    const lines = buildWhyPickedLines(act, {
      childName: "Sam",
      tier: 2,
      mood: "calm",
      personalization: null,
      lastCompletionByActivity: null,
      recentActivityIds: [],
    });
    expect(lines.some(l => l.includes("Tier 2"))).toBe(true);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThanOrEqual(4);
  });

  it("mentions mood match when activity supports mood", () => {
    const act = ACTIVITIES.find(a => a.id === "a01")!;
    const lines = buildWhyPickedLines(act, {
      childName: "Sam",
      tier: 1,
      mood: "calm",
      personalization: null,
      lastCompletionByActivity: null,
      recentActivityIds: [],
    });
    expect(lines.some(l => /mood/i.test(l))).toBe(true);
  });

  it("mentions AI literacy line for tagged activities", () => {
    const act = ACTIVITIES.find(a => a.id === "a26")!;
    const lines = buildWhyPickedLines(act, {
      childName: "Sam",
      tier: 4,
      mood: "focus",
      personalization: null,
      lastCompletionByActivity: null,
      recentActivityIds: [],
    });
    expect(lines.some(l => /human \+ tools literacy/i.test(l))).toBe(true);
  });
});

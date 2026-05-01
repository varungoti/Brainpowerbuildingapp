import { describe, expect, it } from "vitest";
import { buildPrintableGuideFallback, hashPrintablePack } from "./guideFallback";
import type { Activity } from "../../app/data/activities";

const activity: Activity = {
  id: "a-test",
  name: "Button Sorting",
  emoji: "🔵",
  regionEmoji: "🌍",
  region: "Global",
  description: "Sort buttons by color.",
  instructions: ["Gather buttons", "Sort by color", "Count each pile"],
  duration: 12,
  materials: ["Buttons", "Bowls"],
  intelligences: ["Logical-Mathematical"],
  method: "Montessori",
  ageTiers: [2, 3],
  difficulty: 1,
  parentTip: "Sorting builds classification and early math.",
};

describe("printable guide fallback", () => {
  it("creates a complete deterministic guide from activities", () => {
    const guide = buildPrintableGuideFallback({
      childName: "Ari",
      ageTier: 3,
      activities: [activity],
    });

    expect(guide.title).toContain("Ari");
    expect(guide.activities).toHaveLength(1);
    expect(guide.activities[0].steps).toEqual(activity.instructions);
    expect(guide.materials).toContain("Buttons");
    expect(guide.footer).toMatch(/not diagnosis/i);
  });

  it("hashes the same pack consistently", () => {
    expect(hashPrintablePack([activity])).toBe(hashPrintablePack([activity]));
  });
});

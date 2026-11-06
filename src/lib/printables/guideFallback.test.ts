import { describe, expect, it } from "vitest";
import { buildPrintableActivityFallback, buildPrintableGuideFallback, hashPrintablePack } from "./guideFallback";
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

  it("preserves all authored instructions beyond seven steps", () => {
    const instructions = Array.from({ length: 10 }, (_, i) => `Authored step ${i + 1}.`);
    const card = buildPrintableActivityFallback({ ...activity, instructions });
    expect(card.steps).toEqual(instructions);
    expect(card.steps).not.toBe(instructions);
  });

  it("retains every safety warning in order", () => {
    const contraindications = ["Supervise closely.", "Clear the floor.", "Stop when tired."];
    expect(buildPrintableActivityFallback({ ...activity, contraindications }).safetyNote)
      .toBe(contraindications.join(" "));
  });

  it("does not lose later warnings when the first entry is blank", () => {
    expect(buildPrintableActivityFallback({ ...activity, contraindications: ["  ", "Keep away from heat."] }).safetyNote)
      .toBe("Keep away from heat.");
  });

  it("keeps generic supervision for missing, empty or blank warnings", () => {
    for (const contraindications of [undefined, [], [" ", "\n", "\t"]]) {
      expect(buildPrintableActivityFallback({ ...activity, contraindications }).safetyNote)
        .toBe("Supervise closely and use only safe household materials.");
    }
  });

  it("trims blanks and exact duplicate warnings without reordering", () => {
    const contraindications = [" Stop when tired. ", "", "Stop when tired.", "Clear the floor."];
    expect(buildPrintableActivityFallback({ ...activity, contraindications }).safetyNote)
      .toBe("Stop when tired. Clear the floor.");
  });

  it("preserves non-Latin warning text", () => {
    const warning = "वयस्क की निगरानी में खेलें।";
    expect(buildPrintableActivityFallback({ ...activity, contraindications: [warning] }).safetyNote).toBe(warning);
  });

  it("preserves valid warnings around malformed JSON entries", () => {
    const contraindications = ["First caution.", null, 42, {}, [], true, "Last caution."] as unknown as string[];
    expect(buildPrintableActivityFallback({ ...activity, contraindications }).safetyNote)
      .toBe("First caution. Last caution.");
  });

  it("uses generic supervision when warning collections have the wrong shape", () => {
    for (const value of [null, "Not an array", 42, true, { 0: "Not an array" }]) {
      const contraindications = value as unknown as string[];
      expect(buildPrintableActivityFallback({ ...activity, contraindications }).safetyNote)
        .toBe("Supervise closely and use only safe household materials.");
    }
  });

  it("uses generic supervision when every warning entry is malformed", () => {
    const contraindications = [null, false, 42, {}, []] as unknown as string[];
    expect(buildPrintableActivityFallback({ ...activity, contraindications }).safetyNote)
      .toBe("Supervise closely and use only safe household materials.");
  });

  it("keeps separate activities' steps and safety notes separate", () => {
    const first = { ...activity, contraindications: ["First caution.", "Another first caution."] };
    const second = { ...activity, id: "synthetic-second", instructions: ["Second step."], contraindications: ["Second caution."] };
    const guide = buildPrintableGuideFallback({ childName: "Synthetic", ageTier: 3, activities: [first, second] });
    expect(guide.activities.map(card => card.steps)).toEqual([first.instructions, second.instructions]);
    expect(guide.activities.map(card => card.safetyNote)).toEqual(["First caution. Another first caution.", "Second caution."]);
  });

  it("does not mutate authored instructions or warning strings", () => {
    const input = { ...activity, instructions: [...activity.instructions], contraindications: [" First warning. ", "Second warning."] };
    const before = structuredClone(input);
    buildPrintableActivityFallback(input).steps[0] = "Consumer edit";
    expect(input).toEqual(before);
  });
});

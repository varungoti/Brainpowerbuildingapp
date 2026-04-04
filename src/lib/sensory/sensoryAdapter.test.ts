import { describe, it, expect } from "vitest";
import type { SensoryProfile } from "../../app/context/AppContext";
import type { Activity } from "../../app/data/activities";
import { adaptActivity } from "./sensoryAdapter";

function neurotypical(): SensoryProfile {
  return { type: "neurotypical", conditions: [], modifications: [] };
}

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "s1",
    name: "Drawing",
    emoji: "✏️",
    regionEmoji: "🧠",
    region: "Parietal",
    description: "Draw lines",
    instructions: ["Hold pencil", "Draw a line"],
    duration: 10,
    materials: ["paper", "pencils"],
    intelligences: ["Bodily-Kinesthetic"],
    method: "Free play",
    ageTiers: [2],
    difficulty: 2,
    parentTip: "",
    ...overrides,
  };
}

describe("adaptActivity", () => {
  it("returns original instructions and materials for neurotypical profile", () => {
    const activity = makeActivity();
    const result = adaptActivity(activity, neurotypical());
    expect(result.adaptedInstructions).toEqual(activity.instructions);
    expect(result.adaptedMaterials).toEqual(activity.materials);
    expect(result.warnings).toEqual([]);
    expect(result.badges).toEqual([]);
  });

  it("swaps materials for fine-motor-delay when materials match swap keys", () => {
    const activity = makeActivity({ materials: ["paper", "pencils"] });
    const profile: SensoryProfile = {
      type: "neurotypical",
      conditions: ["fine-motor-delay"],
      modifications: [],
    };
    const result = adaptActivity(activity, profile);
    expect(result.adaptedMaterials.some(m => m.includes("chunky") || m.includes("finger"))).toBe(
      true,
    );
    expect(result.adaptedInstructions[0]).toContain("hand-over-hand");
  });

  it("uses activity.sensoryModifications when defined for a condition", () => {
    const activity = makeActivity({
      sensoryModifications: {
        asd: {
          instructions: ["Preview step 1", "Preview step 2"],
          materials: ["visual schedule card"],
        },
      },
    });
    const profile: SensoryProfile = {
      type: "mixed",
      conditions: ["asd"],
      modifications: [],
    };
    const result = adaptActivity(activity, profile);
    expect(result.adaptedMaterials).toEqual(["visual schedule card"]);
    expect(result.adaptedInstructions).toEqual(["Preview step 1", "Preview step 2"]);
    expect(result.badges).toContain("Adapted for asd");
  });
});

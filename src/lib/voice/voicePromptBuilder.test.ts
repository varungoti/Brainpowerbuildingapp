import { describe, it, expect } from "vitest";
import type { Activity } from "../../app/data/activities";
import {
  buildActivityNarration,
  buildCompletionNarration,
  buildStepNarration,
} from "./voicePromptBuilder";

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "v1",
    name: "Color Sort",
    emoji: "🎨",
    regionEmoji: "🧠",
    region: "Frontal",
    description: "Sort objects by color.",
    instructions: ["Lay out three colored mats", "Sort items onto mats"],
    duration: 12,
    materials: ["cups", "pencils", "paper"],
    intelligences: ["Logical-Mathematical"],
    method: "Montessori",
    ageTiers: [2],
    difficulty: 1,
    parentTip: "Praise effort, not speed.",
    ...overrides,
  };
}

describe("buildActivityNarration", () => {
  it("includes the activity name", () => {
    const text = buildActivityNarration(makeActivity({ name: "Rainbow Walk" }));
    expect(text).toContain("Rainbow Walk");
  });

  it("includes materials when present", () => {
    const text = buildActivityNarration(makeActivity());
    expect(text).toContain("cups");
    expect(text).toContain("pencils");
    expect(text).toContain("paper");
  });

  it("uses the child name in the greeting when provided", () => {
    const text = buildActivityNarration(makeActivity({ name: "Bubble Breaths" }), "Sam");
    expect(text).toContain("Hey Sam!");
    expect(text).toContain("Bubble Breaths");
  });
});

describe("buildCompletionNarration", () => {
  it("includes the activity name", () => {
    const text = buildCompletionNarration("Shape Hunt");
    expect(text).toContain("Shape Hunt");
    expect(text).toContain("completed");
  });

  it("addresses the child by name when provided", () => {
    const text = buildCompletionNarration("Quiet Time", "Riya");
    expect(text).toContain("Riya");
    expect(text).toContain("Quiet Time");
  });
});

describe("buildStepNarration", () => {
  it("formats step index and text", () => {
    expect(buildStepNarration("Wash hands", 1)).toBe("Step 1: Wash hands");
  });
});

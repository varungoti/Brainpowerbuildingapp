import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ChildProfile } from "../../app/context/AppContext";
import type { Activity } from "../../app/data/activities";
import { canCollaborate, matchActivities } from "./siblingMatcher";

function makeChild(id: string, ageTier: number): ChildProfile {
  return {
    id,
    name: `Child ${id}`,
    dob: "2017-01-01",
    ageTier,
    avatarEmoji: "🧒",
    avatarColor: "#2196f3",
    brainPoints: 0,
    level: 1,
    streak: 0,
    lastStreakDate: "",
    badges: [],
    totalActivities: 0,
    intelligenceScores: {},
  };
}

function makeActivity(overrides: Partial<Activity>): Activity {
  return {
    id: "sib-act",
    name: "Partner Game",
    emoji: "🎲",
    regionEmoji: "🌍",
    region: "Frontal",
    description: "Test",
    instructions: ["Step one", "Step two"],
    duration: 10,
    materials: [],
    intelligences: ["Interpersonal"],
    method: "Play",
    ageTiers: [2, 3],
    difficulty: 1,
    parentTip: "",
    ...overrides,
  };
}

describe("canCollaborate", () => {
  it("returns false when there is only one child", () => {
    const children = [makeChild("a", 2)];
    const activity = makeActivity({ collaborationType: "joint" });
    expect(canCollaborate(children, activity)).toBe(false);
  });

  it("returns true for two children when the activity shares an age tier with the group", () => {
    const children = [makeChild("a", 2), makeChild("b", 3)];
    const activity = makeActivity({ ageTiers: [2, 3, 4], collaborationType: "parallel" });
    expect(canCollaborate(children, activity)).toBe(true);
  });

  it("returns true without collaborationType when activity lists multiple tiers", () => {
    const children = [makeChild("a", 1), makeChild("b", 2)];
    const activity = makeActivity({ ageTiers: [1, 2], collaborationType: undefined });
    expect(canCollaborate(children, activity)).toBe(true);
  });
});

describe("matchActivities", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty array for a single child", () => {
    const children = [makeChild("solo", 2)];
    const activities = [makeActivity({ id: "x" })];
    expect(matchActivities(children, activities)).toEqual([]);
  });

  it("returns non-empty packs when two children can both do an activity", () => {
    const children = [makeChild("a", 2), makeChild("b", 3)];
    const activities = [
      makeActivity({
        id: "pair-1",
        ageTiers: [2, 3],
        intelligences: ["Interpersonal", "Linguistic"],
        siblingRoles: { younger: "sorter", older: "reader" },
        collaborationType: "parallel",
      }),
    ];
    const packs = matchActivities(children, activities, 5);
    expect(packs.length).toBe(1);
    expect(packs[0].activity.id).toBe("pair-1");
    expect(packs[0].roles.a).toBe("sorter");
    expect(packs[0].roles.b).toBe("reader");
    expect(packs[0].adaptedInstructions.a).toEqual(["Step one", "Step two"]);
  });
});

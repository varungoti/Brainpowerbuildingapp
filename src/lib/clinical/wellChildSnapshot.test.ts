import { describe, it, expect } from "vitest";
import type { ActivityLog, ChildProfile } from "../../app/context/AppContext";
import { buildSnapshotData, renderSnapshotHtml, WELL_CHILD_VISIT_AGES_MONTHS } from "./wellChildSnapshot";

function child(ageMonths: number, name = "Aria"): ChildProfile {
  const dob = new Date();
  dob.setMonth(dob.getMonth() - ageMonths);
  return {
    id: "c1",
    name,
    dob: dob.toISOString(),
    age: Math.floor(ageMonths / 12),
    ageTier: 2,
    avatar: "🧒",
    badges: [],
    gardnerBadges: [],
    intelligenceScores: {},
    competencyScores: {},
    materials: [],
    location: "",
    devUpdate: "",
    onboardingComplete: true,
    interests: [],
    challenges: [],
  } as unknown as ChildProfile;
}

function log(region: string, intel: string[], dayAgo = 0): ActivityLog {
  return {
    id: Math.random().toString(36).slice(2),
    childId: "c1",
    activityId: "x",
    activityName: "x",
    emoji: "🟢",
    date: new Date(Date.now() - dayAgo * 86400000).toISOString(),
    intelligences: intel,
    method: "play",
    region,
    regionEmoji: "🧠",
    duration: 12,
    completed: true,
    engagementRating: 4,
    parentNotes: "",
    brainPointsEarned: 5,
  } as ActivityLog;
}

describe("buildSnapshotData", () => {
  it("picks the nearest pediatric anchor visit", () => {
    const d = buildSnapshotData(child(13), [], []);
    expect(WELL_CHILD_VISIT_AGES_MONTHS).toContain(d.anchor);
    expect(d.anchor).toBe(12);
  });

  it("aggregates last-30-day practice minutes", () => {
    const logs = [log("Linguistic", ["Linguistic"], 1), log("Linguistic", ["Linguistic"], 5), log("Linguistic", ["Linguistic"], 60)];
    const d = buildSnapshotData(child(36), logs, []);
    expect(d.totalPracticeMinutes).toBe(24);
  });

  it("ranks top regions by recent count", () => {
    const logs = [
      log("Linguistic", ["Linguistic"], 1),
      log("Linguistic", ["Linguistic"], 2),
      log("Logical-Mathematical", ["Logical-Mathematical"], 3),
    ];
    const d = buildSnapshotData(child(36), logs, []);
    expect(d.topRegions[0].region).toBe("Linguistic");
    expect(d.topRegions[0].count).toBe(2);
  });
});

describe("renderSnapshotHtml", () => {
  it("returns a complete, well-formed HTML document with the child name", () => {
    const d = buildSnapshotData(child(36, "Kiran"), [], []);
    const html = renderSnapshotHtml(d);
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain("Kiran");
    expect(html).toContain("Bayesian posteriors");
    expect(html).toContain("clinical diagnosis");
    expect(html).toContain("Compliance: COPPA 2.0");
  });

  it("HTML-escapes the child name to avoid injection", () => {
    const d = buildSnapshotData(child(36, "Kiran<script>alert(1)</script>"), [], []);
    const html = renderSnapshotHtml(d);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

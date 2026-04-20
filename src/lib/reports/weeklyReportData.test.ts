import { describe, it, expect } from "vitest";
import type { ActivityLog, ChildProfile } from "../../app/context/AppContext";
import { buildWeeklyReport } from "./weeklyReportData";

function makeChild(overrides: Partial<ChildProfile> = {}): ChildProfile {
  return {
    id: "kid-1",
    name: "Alex",
    dob: "2018-06-01",
    ageTier: 3,
    avatarEmoji: "🙂",
    avatarColor: "#4caf50",
    brainPoints: 120,
    level: 4,
    streak: 2,
    lastStreakDate: "2026-04-01",
    badges: [],
    totalActivities: 10,
    intelligenceScores: {},
    ...overrides,
  };
}

/** ISO date string for a local noon on the same calendar day as `ref` (avoids week-boundary TZ issues). */
function atNoonOnSameDay(ref: Date): string {
  return new Date(
    ref.getFullYear(),
    ref.getMonth(),
    ref.getDate(),
    14,
    0,
    0,
  ).toISOString();
}

function baseLog(childId: string, ref: Date, overrides: Partial<ActivityLog>): ActivityLog {
  return {
    id: "l1",
    childId,
    activityId: "a01",
    activityName: "Sample",
    emoji: "🎯",
    date: atNoonOnSameDay(ref),
    intelligences: ["Linguistic"],
    method: "Montessori",
    region: "Frontal",
    regionEmoji: "🧠",
    duration: 15,
    completed: true,
    engagementRating: 4,
    parentNotes: "",
    brainPointsEarned: 10,
    ...overrides,
  };
}

describe("buildWeeklyReport", () => {
  it("returns zeroed activity stats when logs are empty", () => {
    const child = makeChild();
    const ref = new Date(2026, 3, 2);
    const report = buildWeeklyReport(child, [], ref);

    expect(report.totalActivities).toBe(0);
    expect(report.totalMinutes).toBe(0);
    expect(report.avgEngagement).toBe(0);
    expect(report.coveredRegions).toBe(0);
    expect(report.topIntelligences).toEqual([]);
    expect(report.regionCoverage.every(r => r.activitiesCount === 0)).toBe(true);
    expect(report.regionCoverage.every(r => r.totalMinutes === 0)).toBe(true);
    expect(report.childName).toBe("Alex");
    expect(report.brainPoints).toBe(120);
    expect(report.level).toBe(4);
  });

  it("filters to the child and current ISO week window", () => {
    const child = makeChild({ id: "only-me" });
    const ref = new Date(2026, 3, 2);
    const inWeek = baseLog("only-me", ref, { id: "in" });
    const otherChild = baseLog("other", ref, { id: "wrong-child" });
    const report = buildWeeklyReport(child, [inWeek, otherChild], ref);

    expect(report.totalActivities).toBe(1);
  });

  it("aggregates region coverage, minutes, and engagement from sample logs", () => {
    const child = makeChild();
    const ref = new Date(2026, 3, 2);
    const logs: ActivityLog[] = [
      baseLog(child.id, ref, {
        id: "1",
        region: "Temporal",
        duration: 20,
        engagementRating: 5,
        intelligences: ["Musical-Rhythmic"],
      }),
      baseLog(child.id, ref, {
        id: "2",
        region: "Temporal",
        duration: 10,
        engagementRating: 3,
        intelligences: ["Musical-Rhythmic", "Logical-Mathematical"],
      }),
    ];
    const report = buildWeeklyReport(child, logs, ref);

    expect(report.totalActivities).toBe(2);
    expect(report.totalMinutes).toBe(30);
    expect(report.avgEngagement).toBe(4);
    const temporal = report.regionCoverage.find(r => r.region === "Temporal");
    expect(temporal?.activitiesCount).toBe(2);
    expect(temporal?.totalMinutes).toBe(30);
    expect(temporal?.avgEngagement).toBe(4);
    expect(report.coveredRegions).toBeGreaterThanOrEqual(1);
    expect(report.topIntelligences.length).toBeGreaterThan(0);
  });

  it("emits a 12-row competency coverage rollup sorted weakest-first", () => {
    const child = makeChild({
      competencyScores: { "creative-generation": 80, "ethical-judgment": 5 },
    });
    const ref = new Date(2026, 3, 2);
    const report = buildWeeklyReport(child, [], ref);

    expect(report.competencyCoverage).toHaveLength(12);
    expect(report.competencyCoverage[0].percent).toBeLessThanOrEqual(
      report.competencyCoverage[report.competencyCoverage.length - 1].percent,
    );
    expect(report.competencyFocus).toHaveLength(2);
    expect(report.competencyFocus[0].id).toBe(report.competencyCoverage[0].id);
  });
});

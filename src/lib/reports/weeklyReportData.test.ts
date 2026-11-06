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

describe("weekly local-calendar reporting", () => {
  const ref = new Date(2026, 3, 2, 12);
  const everyDay = "Completed an activity every day this week!";
  const localLog = (date: Date, overrides: Partial<ActivityLog> = {}) =>
    baseLog("kid-1", date, { date: date.toISOString(), ...overrides });

  it("labels the Monday–Sunday window using local dates", () => {
    for (const date of [ref, new Date(2026, 3, 5, 23, 59)]) {
      const report = buildWeeklyReport(makeChild(), [], date);
      expect(report.weekStart).toBe("2026-03-30");
      expect(report.weekEnd).toBe("2026-04-05");
    }
  });

  it("includes both local week endpoints but excludes adjacent instants", () => {
    const dates = [
      new Date(2026, 2, 29, 23, 59, 59, 999),
      new Date(2026, 2, 30, 0),
      new Date(2026, 3, 5, 23, 59, 59, 999),
      new Date(2026, 3, 6, 0),
    ];
    const report = buildWeeklyReport(makeChild(), dates.map(date => localLog(date)), ref);
    expect(report.totalActivities).toBe(2);
    expect(report.streakDays).toBe(2);
  });

  it("counts local days rather than the stored timestamp's date prefix", () => {
    const sameDay = [new Date(2026, 3, 1, 0, 1), new Date(2026, 3, 1, 23, 59)];
    const adjacentDays = [new Date(2026, 3, 1, 23, 59), new Date(2026, 3, 2, 0, 1)];
    expect(buildWeeklyReport(makeChild(), sameDay.map(date => localLog(date)), ref).streakDays).toBe(1);
    expect(buildWeeklyReport(makeChild(), adjacentDays.map(date => localLog(date)), ref).streakDays).toBe(2);
  });

  it("does not turn repeated same-day activities into an everyday claim", () => {
    const logs = Array.from({ length: 7 }, (_, i) => localLog(new Date(2026, 3, 1, i)));
    const report = buildWeeklyReport(makeChild(), logs, ref);
    expect(report.streakDays).toBe(1);
    expect(report.highlights).not.toContain(everyDay);
  });

  it("highlights seven distinct local active days", () => {
    const logs = Array.from({ length: 7 }, (_, i) => localLog(new Date(2026, 2, 30 + i, 0, 1)));
    const report = buildWeeklyReport(makeChild(), logs, ref);
    expect(report.streakDays).toBe(7);
    expect(report.highlights).toContain(everyDay);
  });

  it("treats valid date-only history as local calendar days", () => {
    const logs = ["2026-03-30", "2026-04-05", "2026-03-29", "2026-04-06"]
      .map(date => baseLog("kid-1", ref, { date }));
    const report = buildWeeklyReport(makeChild(), logs, ref);
    expect(report.totalActivities).toBe(2);
    expect(report.streakDays).toBe(2);
  });

  it("ignores unparseable dates and impossible date-only values", () => {
    const logs = ["not-a-date", "", "2026-02-30", "2026-02-29"]
      .map(date => baseLog("kid-1", ref, { date }));
    const report = buildWeeklyReport(makeChild(), logs, new Date(2026, 2, 1));
    expect(report.totalActivities).toBe(0);
    expect(report.streakDays).toBe(0);
  });

  it("preserves leap days", () => {
    const report = buildWeeklyReport(makeChild(), [baseLog("kid-1", ref, { date: "2024-02-29" })], new Date(2024, 1, 29));
    expect(report.totalActivities).toBe(1);
    expect(report.streakDays).toBe(1);
  });

  it("keeps all seven days across spring and fall DST weeks", () => {
    for (const [month, monday, end] of [[2, 2, "2026-03-08"], [9, 26, "2026-11-01"]] as const) {
      const logs = Array.from({ length: 7 }, (_, i) => localLog(new Date(2026, month, monday + i, 23, 30)));
      const report = buildWeeklyReport(makeChild(), logs, new Date(2026, month, monday + 6, 23, 30));
      expect(report.totalActivities).toBe(7);
      expect(report.streakDays).toBe(7);
      expect(report.weekEnd).toBe(end);
    }
  });

  it("excludes incomplete and other-child activities from active days", () => {
    const logs = [localLog(ref), localLog(new Date(2026, 3, 3), { completed: false }), localLog(new Date(2026, 3, 4), { childId: "other-synthetic-child" })];
    const report = buildWeeklyReport(makeChild(), logs, ref);
    expect(report.totalActivities).toBe(1);
    expect(report.streakDays).toBe(1);
  });

  it("rejects an invalid reference date", () => {
    expect(() => buildWeeklyReport(makeChild(), [], new Date(NaN))).toThrow(RangeError);
  });
});

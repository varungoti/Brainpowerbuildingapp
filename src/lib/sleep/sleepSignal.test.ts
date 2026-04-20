import { describe, it, expect } from "vitest";
import {
  bucketFromMinutes,
  recommendedSleepHours,
  shouldSurfaceBedtimeRoutine,
  sleepDebtFactor,
  workingMemoryMultiplierFromDebt,
  type SleepNight,
} from "./sleepSignal";

describe("recommendedSleepHours", () => {
  it("uses AAP ranges by age", () => {
    expect(recommendedSleepHours(12).minHours).toBe(11);
    expect(recommendedSleepHours(48).minHours).toBe(10);
    expect(recommendedSleepHours(96).minHours).toBe(9);
  });
});

describe("bucketFromMinutes", () => {
  it("classifies a 4yo with 11h as excellent", () => {
    expect(bucketFromMinutes(11 * 60, 48)).toBe("excellent");
  });
  it("classifies a 4yo with 9h as short", () => {
    expect(bucketFromMinutes(9 * 60, 48)).toBe("short");
  });
  it("classifies a 4yo with 7h as deficient", () => {
    expect(bucketFromMinutes(7 * 60, 48)).toBe("deficient");
  });
  it("excellent requires ≤1 awakening", () => {
    expect(bucketFromMinutes(11 * 60, 48, { awakenings: 3 })).toBe("adequate");
  });
});

describe("sleepDebtFactor", () => {
  const today = "2026-04-17";
  const yesterday = "2026-04-16";
  const dayBefore = "2026-04-15";

  function n(date: string, bucket: SleepNight["bucket"]): SleepNight {
    return { childId: "c1", nightDate: date, bucket, source: "manual" };
  }

  it("returns 0 for empty input", () => {
    expect(sleepDebtFactor([])).toBe(0);
  });

  it("excellent week → 0", () => {
    expect(sleepDebtFactor([n(today, "excellent"), n(yesterday, "excellent")])).toBe(0);
  });

  it("recent deficient weighs more than older", () => {
    const recent = sleepDebtFactor([n(today, "deficient"), n(yesterday, "excellent"), n(dayBefore, "excellent")]);
    const older = sleepDebtFactor([n(today, "excellent"), n(yesterday, "excellent"), n(dayBefore, "deficient")]);
    expect(recent).toBeGreaterThan(older);
  });

  it("staying short produces meaningful debt", () => {
    const f = sleepDebtFactor([
      n("2026-04-17", "short"), n("2026-04-16", "short"), n("2026-04-15", "short"),
    ]);
    expect(f).toBeGreaterThan(0.3);
    expect(f).toBeLessThan(0.5);
  });
});

describe("workingMemoryMultiplierFromDebt", () => {
  it("clamps to [0.85, 1.0]", () => {
    expect(workingMemoryMultiplierFromDebt(0)).toBe(1.0);
    expect(workingMemoryMultiplierFromDebt(1)).toBeCloseTo(0.85, 5);
    expect(workingMemoryMultiplierFromDebt(2)).toBeCloseTo(0.85, 5);
  });
});

describe("shouldSurfaceBedtimeRoutine", () => {
  it("true when latest night is short", () => {
    expect(shouldSurfaceBedtimeRoutine([
      { childId: "c1", nightDate: "2026-04-17", bucket: "short", source: "manual" },
    ])).toBe(true);
  });
  it("false when latest night is excellent", () => {
    expect(shouldSurfaceBedtimeRoutine([
      { childId: "c1", nightDate: "2026-04-17", bucket: "excellent", source: "manual" },
      { childId: "c1", nightDate: "2026-04-16", bucket: "deficient", source: "manual" },
    ])).toBe(false);
  });
});

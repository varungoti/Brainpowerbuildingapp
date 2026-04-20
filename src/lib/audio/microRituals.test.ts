import { describe, it, expect } from "vitest";
import {
  AUDIO_MICRO_RITUALS,
  pickDailyRitual,
  ritualsForAge,
  ritualsForMoment,
} from "./microRituals";

describe("micro-rituals catalog", () => {
  it("ships exactly 15 rituals (per the survivor doc)", () => {
    expect(AUDIO_MICRO_RITUALS.length).toBe(15);
  });

  it("every ritual is between 90 and 120 seconds", () => {
    for (const r of AUDIO_MICRO_RITUALS) {
      expect(r.durationSec).toBeGreaterThanOrEqual(90);
      expect(r.durationSec).toBeLessThanOrEqual(120);
    }
  });

  it("every ritual has at least one competency tag", () => {
    for (const r of AUDIO_MICRO_RITUALS) {
      expect(r.competencyTags.length).toBeGreaterThan(0);
    }
  });

  it("every ritual has a coherent age range", () => {
    for (const r of AUDIO_MICRO_RITUALS) {
      expect(r.minAgeMonths).toBeGreaterThan(0);
      expect(r.maxAgeMonths).toBeGreaterThan(r.minAgeMonths);
    }
  });

  it("filters by age", () => {
    const r24 = ritualsForAge(24);
    const r96 = ritualsForAge(96);
    expect(r24.every((r) => r.minAgeMonths <= 24 && r.maxAgeMonths >= 24)).toBe(true);
    expect(r96.every((r) => r.minAgeMonths <= 96 && r.maxAgeMonths >= 96)).toBe(true);
  });

  it("filters by moment, including anytime fallthrough", () => {
    const car = ritualsForMoment("car-ride");
    expect(car.every((r) => r.moment === "car-ride" || r.moment === "anytime")).toBe(true);
    const any = ritualsForMoment("anytime");
    expect(any.length).toBe(AUDIO_MICRO_RITUALS.length);
  });

  it("picks a ritual deterministically given a seed", () => {
    const a = pickDailyRitual(60, "car-ride", 1);
    const b = pickDailyRitual(60, "car-ride", 1);
    expect(a?.id).toBe(b?.id);
  });

  it("returns null when no ritual fits the age + moment", () => {
    const tooYoung = pickDailyRitual(6, "errand");
    expect(tooYoung).toBeNull();
  });
});

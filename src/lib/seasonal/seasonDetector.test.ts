import { describe, it, expect } from "vitest";
import {
  detectSeason,
  seasonMatchScore,
  getSeasonalTags,
} from "./seasonDetector";

describe("detectSeason", () => {
  it("returns summer for a fixed June date in northern hemisphere", () => {
    const cfg = detectSeason(new Date(2026, 5, 15), "northern");
    expect(cfg.season).toBe("summer");
    expect(cfg.months).toContain(6);
  });

  it("returns monsoon for a July date in India calendar", () => {
    const cfg = detectSeason(new Date(2026, 6, 10), "india");
    expect(cfg.season).toBe("monsoon");
  });

  it("returns winter for January in India", () => {
    const cfg = detectSeason(new Date(2026, 0, 20), "india");
    expect(cfg.season).toBe("winter");
  });
});

describe("seasonMatchScore", () => {
  it("returns 0 when tags are missing or empty", () => {
    expect(seasonMatchScore(undefined, "summer")).toBe(0);
    expect(seasonMatchScore([], "summer")).toBe(0);
  });

  it("returns a positive score when activity tags overlap current season", () => {
    const summerTags = getSeasonalTags("summer");
    expect(summerTags.length).toBeGreaterThan(0);
    const score = seasonMatchScore(["outdoor", "summer"], "summer");
    expect(score).toBeGreaterThan(0);
  });

  it("scores multiple matches as 8 points each", () => {
    const tags = getSeasonalTags("winter");
    const twoMatches = tags.slice(0, 2);
    expect(seasonMatchScore(twoMatches, "winter")).toBe(16);
  });
});

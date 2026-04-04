import { describe, it, expect } from "vitest";
import type { CommunityRatingCache } from "../../app/context/AppContext";
import { communityScoreBonus } from "./communityScorer";

describe("communityScoreBonus", () => {
  it("returns 0 when cache is null", () => {
    expect(communityScoreBonus("any-id", null)).toBe(0);
  });

  it("returns 0 when the activity is missing or count is below 3", () => {
    const cache: CommunityRatingCache = {
      ratings: {
        "act-a": { avg: 5, count: 2 },
      },
      fetchedAt: new Date().toISOString(),
    };
    expect(communityScoreBonus("missing", cache)).toBe(0);
    expect(communityScoreBonus("act-a", cache)).toBe(0);
  });

  it("returns a calculated bonus for rated activities with enough samples", () => {
    const cache: CommunityRatingCache = {
      ratings: {
        popular: { avg: 5, count: 10 },
        average: { avg: 3, count: 5 },
      },
      fetchedAt: new Date().toISOString(),
    };
    expect(communityScoreBonus("popular", cache)).toBe(8);
    expect(communityScoreBonus("average", cache)).toBe(0);
  });

  it("rounds the bonus to the nearest integer", () => {
    const cache: CommunityRatingCache = {
      ratings: {
        edge: { avg: 3.5, count: 4 },
      },
      fetchedAt: new Date().toISOString(),
    };
    expect(communityScoreBonus("edge", cache)).toBe(2);
  });
});

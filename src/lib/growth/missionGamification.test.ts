import { describe, expect, it } from "vitest";
import { ADMIN_MISSIONS } from "./adminMissionCatalog";
import {
  levelFromTotalXp,
  streakFromCompletionTimestamps,
  summarizeMissions,
} from "./missionGamification";

describe("missionGamification", () => {
  it("levels up every 400 XP", () => {
    expect(levelFromTotalXp(0).level).toBe(1);
    expect(levelFromTotalXp(399).level).toBe(1);
    expect(levelFromTotalXp(400).level).toBe(2);
    expect(levelFromTotalXp(400).xpIntoLevel).toBe(0);
  });

  it("computes streak across UTC days (forgiving if not completed today)", () => {
    const now = new Date("2026-05-10T15:00:00.000Z");
    expect(streakFromCompletionTimestamps([], now)).toBe(0);
    expect(streakFromCompletionTimestamps(["2026-05-10T10:00:00.000Z"], now)).toBe(1);
    expect(
      streakFromCompletionTimestamps(
        ["2026-05-10T10:00:00.000Z", "2026-05-09T10:00:00.000Z", "2026-05-08T10:00:00.000Z"],
        now,
      ),
    ).toBe(3);
    // No activity today: still counts from yesterday backward
    expect(
      streakFromCompletionTimestamps(["2026-05-09T10:00:00.000Z", "2026-05-08T10:00:00.000Z"], now),
    ).toBe(2);
  });

  it("summarizes catalog with merges and track stats", () => {
    const first = ADMIN_MISSIONS[0];
    const { merged, stats } = summarizeMissions(ADMIN_MISSIONS, [
      { mission_key: first.key, completed_at: "2026-05-01T12:00:00.000Z", xp_awarded: first.xp },
    ]);
    expect(merged.find((m) => m.key === first.key)?.completed).toBe(true);
    expect(stats.completedCount).toBe(1);
    expect(stats.totalMissions).toBe(ADMIN_MISSIONS.length);
    expect(stats.badges.some((b) => b.id === "first_step" && b.unlocked)).toBe(true);
  });
});

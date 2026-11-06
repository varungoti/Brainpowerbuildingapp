import { afterEach, describe, expect, it, vi } from "vitest";
import { getWeekEndForDate, getWeekStartForDate, shouldShowReportPrompt } from "./reportScheduler";
import { parseReportLogDate } from "./reportCalendar";

afterEach(() => vi.useRealTimers());

describe("report calendar and scheduler", () => {
  it("uses the same local week keys at midnight and late evening", () => {
    for (const day of [2, 5]) {
      for (const hour of [0, 23]) {
        const date = new Date(2026, 3, day, hour, 59);
        expect(getWeekStartForDate(date)).toBe("2026-03-30");
        expect(getWeekEndForDate(date)).toBe("2026-04-05");
      }
    }
  });

  it("does not prompt again after this local week's report is recorded", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 5, 0, 30));
    expect(shouldShowReportPrompt([])).toBe(true);
    expect(shouldShowReportPrompt([{ weekStart: "2026-03-30", weekEnd: "2026-04-05", generatedAt: new Date().toISOString() }])).toBe(false);
    expect(shouldShowReportPrompt([{ weekStart: "2026-03-23", weekEnd: "2026-03-29", generatedAt: new Date().toISOString() }])).toBe(true);
    expect(shouldShowReportPrompt([], 1)).toBe(false);
  });

  it("preserves years below 100 in date-only inputs", () => {
    const parsed = parseReportLogDate("0099-06-01");
    expect(parsed?.getFullYear()).toBe(99);
    expect(parsed?.getMonth()).toBe(5);
    expect(parsed?.getDate()).toBe(1);
  });

  it("rejects invalid date-only months and days", () => {
    for (const date of ["2026-00-10", "2026-13-01", "2026-04-31", "2026-03-00"]) {
      expect(parseReportLogDate(date)).toBeNull();
    }
  });

  it("rejects invalid reference dates", () => {
    expect(() => getWeekStartForDate(new Date(NaN))).toThrow(RangeError);
    expect(() => getWeekEndForDate(new Date(NaN))).toThrow(RangeError);
  });
});

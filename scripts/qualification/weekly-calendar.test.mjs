// Supplemental Node 24 qualification, not Vitest/React or a full build.
// Run separately with TZ=UTC, America/Los_Angeles, Asia/Kolkata,
// and Pacific/Kiritimati. SOURCE_ROOT can point at an unchanged baseline.
import assert from "node:assert/strict";
import { test } from "node:test";
import { registerHooks, syncBuiltinESMExports } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import net from "node:net";
import tls from "node:tls";
import http from "node:http";
import https from "node:https";

const denyNetwork = () => { throw new Error("Network is disabled in weekly-calendar qualification"); };
net.connect = net.createConnection = tls.connect = denyNetwork;
net.Socket.prototype.connect = denyNetwork;
http.request = http.get = https.request = https.get = denyNetwork;
globalThis.fetch = denyNetwork;
syncBuiltinESMExports();

const root = resolve(process.env.SOURCE_ROOT ?? ".");
const reportUrl = pathToFileURL(resolve(root, "src/lib/reports/weeklyReportData.ts")).href;
const schedulerUrl = pathToFileURL(resolve(root, "src/lib/reports/reportScheduler.ts")).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    const allowed = new Set([
      "../competencies/aiAgeCompetencies", "./reportCalendar",
    ]);
    if (allowed.has(specifier) && [reportUrl, schedulerUrl].includes(context.parentURL)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
const { buildWeeklyReport } = await import(reportUrl);
const { getWeekStartForDate, getWeekEndForDate, shouldShowReportPrompt } = await import(schedulerUrl);
const child = {
  id: "synthetic-child", name: "Synthetic", dob: "2018-06-01", ageTier: 3,
  avatarEmoji: "🙂", avatarColor: "#4caf50", brainPoints: 120, level: 4,
  streak: 2, lastStreakDate: "2026-04-01", badges: [], totalActivities: 10,
  intelligenceScores: {},
};
const everyday = "Completed an activity every day this week!";
function log(date, overrides = {}) {
  return {
    id: `synthetic-${date}`, childId: child.id, activityId: "synthetic-activity",
    activityName: "Synthetic activity", emoji: "🎯", date,
    intelligences: ["Linguistic"], method: "Sample", region: "Frontal",
    regionEmoji: "🧠", duration: 15, completed: true, engagementRating: 4,
    parentNotes: "", brainPointsEarned: 10, ...overrides,
  };
}
const stamp = (year, month, day, hour = 12, minute = 0, second = 0, ms = 0) =>
  new Date(year, month - 1, day, hour, minute, second, ms).toISOString();
const ref = new Date(2026, 3, 2, 12);

test("report labels are local Monday and Sunday", () => {
  const report = buildWeeklyReport(child, [], ref);
  assert.equal(report.weekStart, "2026-03-30");
  assert.equal(report.weekEnd, "2026-04-05");
});
test("scheduler and report agree at both ends of the local day", () => {
  for (const hour of [0, 23]) {
    for (const day of [2, 5]) {
      const date = new Date(2026, 3, day, hour, 59);
      const report = buildWeeklyReport(child, [], date);
      assert.equal(getWeekStartForDate(date), report.weekStart);
      assert.equal(getWeekEndForDate(date), report.weekEnd);
      assert.equal(getWeekStartForDate(date), "2026-03-30");
      assert.equal(getWeekEndForDate(date), "2026-04-05");
    }
  }
});
test("inclusive local week boundaries exclude adjacent instants", () => {
  const dates = [stamp(2026, 3, 29, 23, 59, 59, 999), stamp(2026, 3, 30, 0),
    stamp(2026, 4, 5, 23, 59, 59, 999), stamp(2026, 4, 6, 0)];
  const report = buildWeeklyReport(child, dates.map(date => log(date)), ref);
  assert.equal(report.totalActivities, 2);
  assert.equal(report.streakDays, 2);
});
test("same local day is counted once even across UTC midnight", () => {
  const report = buildWeeklyReport(child, [log(stamp(2026, 4, 1, 0, 1)), log(stamp(2026, 4, 1, 23, 59))], ref);
  assert.equal(report.streakDays, 1);
});
test("adjacent local days are separate even within one UTC day", () => {
  const report = buildWeeklyReport(child, [log(stamp(2026, 4, 1, 23, 59)), log(stamp(2026, 4, 2, 0, 1))], ref);
  assert.equal(report.streakDays, 2);
});
test("seven logs on one day do not claim everyday participation", () => {
  const logs = Array.from({ length: 7 }, (_, i) => log(stamp(2026, 4, 1, i), { id: `synthetic-${i}` }));
  const report = buildWeeklyReport(child, logs, ref);
  assert.equal(report.streakDays, 1);
  assert.ok(!report.highlights.includes(everyday));
});
test("seven separate local days earn the daily highlight", () => {
  const logs = Array.from({ length: 7 }, (_, i) => log(stamp(2026, 3, 30 + i, 0, 1)));
  const report = buildWeeklyReport(child, logs, ref);
  assert.equal(report.streakDays, 7);
  assert.ok(report.highlights.includes(everyday));
});
test("date-only historical logs use local calendar dates", () => {
  const report = buildWeeklyReport(child, [log("2026-03-30"), log("2026-04-05"), log("2026-03-29"), log("2026-04-06")], ref);
  assert.equal(report.totalActivities, 2);
  assert.equal(report.streakDays, 2);
});
test("invalid timestamps and impossible date-only strings are ignored", () => {
  const date = new Date(2026, 2, 1, 12);
  const report = buildWeeklyReport(child, [log("not-a-date"), log(""), log("2026-02-30"), log("2026-02-29")], date);
  assert.equal(report.totalActivities, 0);
  assert.equal(report.streakDays, 0);
});
test("leap day date-only logs remain usable", () => {
  const report = buildWeeklyReport(child, [log("2024-02-29")], new Date(2024, 1, 29, 12));
  assert.equal(report.totalActivities, 1);
  assert.equal(report.streakDays, 1);
});
test("invalid reference dates fail before counting logs", () => {
  assert.throws(() => buildWeeklyReport(child, [log(stamp(2026, 4, 1))], new Date(NaN)), RangeError);
  assert.throws(() => getWeekStartForDate(new Date(NaN)), RangeError);
  assert.throws(() => getWeekEndForDate(new Date(NaN)), RangeError);
});
test("other children and incomplete activities never count", () => {
  const report = buildWeeklyReport(child, [log(stamp(2026, 4, 1)), log(stamp(2026, 4, 2), { childId: "other-synthetic-child" }), log(stamp(2026, 4, 3), { completed: false })], ref);
  assert.equal(report.totalActivities, 1);
  assert.equal(report.streakDays, 1);
  assert.equal(report.totalMinutes, 15);
});
test("spring and fall DST weeks retain all seven calendar days", () => {
  for (const [month, monday, end] of [[3, 2, "2026-03-08"], [10, 26, "2026-11-01"]]) {
    const logs = Array.from({ length: 7 }, (_, i) => log(stamp(2026, month, monday + i, 23, 30)));
    const date = new Date(2026, month - 1, monday + 6, 23, 30);
    const report = buildWeeklyReport(child, logs, date);
    assert.equal(report.totalActivities, 7);
    assert.equal(report.streakDays, 7);
    assert.equal(report.weekEnd, end);
    assert.equal(getWeekStartForDate(date), report.weekStart);
    assert.equal(getWeekEndForDate(date), report.weekEnd);
  }
});
test("Sunday prompt recognizes a report with the same local week key", () => {
  const NativeDate = Date;
  const sunday = new NativeDate(2026, 3, 5, 0, 30);
  globalThis.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [sunday.getTime()])); }
    static now() { return sunday.getTime(); }
  };
  try {
    const report = buildWeeklyReport(child, [], sunday);
    assert.equal(shouldShowReportPrompt([]), true);
    assert.equal(shouldShowReportPrompt([{ generatedAt: sunday.toISOString(), weekStart: report.weekStart, weekEnd: report.weekEnd }]), false);
    assert.equal(shouldShowReportPrompt([], 1), false);
  } finally { globalThis.Date = NativeDate; }
});
test("report footer calls the count active days, not a consecutive streak (source check)", () => {
  const source = readFileSync(resolve(root, "src/app/screens/ReportScreen.tsx"), "utf8");
  assert.match(source, /\{report\.streakDays\} active days this week/);
  assert.doesNotMatch(source, /\{report\.streakDays\}-day streak/);
});

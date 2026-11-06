import type { ReportHistoryEntry } from "../../app/context/AppContext";
import { getLocalWeekBounds, localDateKey } from "./reportCalendar";

export function shouldShowReportPrompt(
  history: ReportHistoryEntry[],
  dayOfWeek: number = new Date().getDay(),
): boolean {
  if (dayOfWeek !== 0) return false;
  const thisWeekStart = getWeekStartForDate();
  return !history.some(h => h.weekStart === thisWeekStart);
}

export function getWeekStartForDate(date: Date = new Date()): string {
  return localDateKey(getLocalWeekBounds(date).start);
}

export function getWeekEndForDate(date: Date = new Date()): string {
  return localDateKey(getLocalWeekBounds(date).end);
}

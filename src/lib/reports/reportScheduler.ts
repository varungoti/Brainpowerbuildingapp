import type { ReportHistoryEntry } from "../../app/context/AppContext";

export function shouldShowReportPrompt(
  history: ReportHistoryEntry[],
  dayOfWeek: number = new Date().getDay(),
): boolean {
  if (dayOfWeek !== 0) return false;
  const thisWeekStart = getWeekStartISO(new Date());
  return !history.some(h => h.weekStart === thisWeekStart);
}

function getWeekStartISO(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

export function getWeekStartForDate(date: Date = new Date()): string {
  return getWeekStartISO(date);
}

export function getWeekEndForDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 6;
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

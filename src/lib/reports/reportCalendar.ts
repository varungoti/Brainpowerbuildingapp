/** Calendar keys use the device timezone, matching the existing report window. */
export function localDateKey(date: Date): string {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Monday through Sunday, using calendar arithmetic across DST transitions. */
export function getLocalWeekBounds(date: Date): { start: Date; end: Date } {
  if (Number.isNaN(date.getTime())) throw new RangeError("Invalid report reference date");
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * App-written timestamps identify instants. Legacy/imported YYYY-MM-DD values
 * identify local calendar days instead of UTC midnight. Invalid dates do not
 * contribute to report counts.
 */
export function parseReportLogDate(value: string): Date | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (parts) {
    const year = Number(parts[1]);
    const month = Number(parts[2]);
    const day = Number(parts[3]);
    const date = new Date(0);
    // setFullYear preserves years 0–99 instead of silently adding 1900.
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
      ? date
      : null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

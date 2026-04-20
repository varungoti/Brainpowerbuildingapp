export type NotificationType =
  | "daily-reminder"
  | "streak-at-risk"
  | "milestone-approaching"
  | "report-ready"
  | "quest-expiring";

export interface NotificationPrefs {
  enabled: boolean;
  maxPerDay: number;
  quietStart: string;
  quietEnd: string;
  types: Record<NotificationType, boolean>;
}

export interface UsagePattern {
  hourBuckets: number[];
  dayBuckets: number[];
  avgSessionMinutes: number;
  lastActiveAt: string;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: true,
  maxPerDay: 1,
  quietStart: "21:00",
  quietEnd: "07:00",
  types: {
    "daily-reminder": true,
    "streak-at-risk": true,
    "milestone-approaching": true,
    "report-ready": true,
    "quest-expiring": true,
  },
};

export const DEFAULT_USAGE_PATTERN: UsagePattern = {
  hourBuckets: new Array(24).fill(0),
  dayBuckets: new Array(7).fill(0),
  avgSessionMinutes: 0,
  lastActiveAt: "",
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isInQuietHours(prefs: NotificationPrefs): boolean {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = timeToMinutes(prefs.quietStart);
  const end = timeToMinutes(prefs.quietEnd);

  if (start > end) {
    return current >= start || current < end;
  }
  return current >= start && current < end;
}

export function getOptimalReminderTime(pattern: UsagePattern): string {
  const peakHour = pattern.hourBuckets.indexOf(Math.max(...pattern.hourBuckets));
  const reminderHour = peakHour === 0 ? 23 : peakHour - 1;
  return `${String(reminderHour).padStart(2, "0")}:30`;
}

export function shouldSendNotification(
  prefs: NotificationPrefs,
  type: NotificationType,
  sentTodayCount: number,
  alreadyActiveToday: boolean,
): boolean {
  if (!prefs.enabled) return false;
  if (!prefs.types[type]) return false;
  if (sentTodayCount >= prefs.maxPerDay) return false;
  if (isInQuietHours(prefs)) return false;
  if (alreadyActiveToday && type === "daily-reminder") return false;
  return true;
}

export function recordAppOpen(pattern: UsagePattern): UsagePattern {
  const now = new Date();
  const updated = { ...pattern };
  updated.hourBuckets = [...pattern.hourBuckets];
  updated.dayBuckets = [...pattern.dayBuckets];
  updated.hourBuckets[now.getHours()] += 1;
  updated.dayBuckets[now.getDay()] += 1;
  updated.lastActiveAt = now.toISOString();
  return updated;
}

export function getNotificationTitle(type: NotificationType, childName: string): { title: string; body: string } {
  switch (type) {
    case "daily-reminder":
      return { title: `Time for ${childName}'s brain boost!`, body: "A quick 10-minute activity makes a big difference." };
    case "streak-at-risk":
      return { title: `${childName}'s streak is at risk!`, body: "Complete one activity today to keep the streak going." };
    case "milestone-approaching":
      return { title: `Milestone ahead for ${childName}!`, body: "A developmental milestone is approaching — check the predictor." };
    case "report-ready":
      return { title: "Weekly report ready!", body: `${childName}'s brain development summary is ready to view.` };
    case "quest-expiring":
      return { title: "Quest expiring soon!", body: "Complete your daily quest before it expires." };
  }
}

export interface EnhancedStreak {
  currentDays: number;
  longestEver: number;
  freezesAvailable: number;
  freezesUsed: number;
  lastActivityDate: string;
  recoveryAvailable: boolean;
  recoveryDeadline?: string;
}

export const DEFAULT_ENHANCED_STREAK: EnhancedStreak = {
  currentDays: 0,
  longestEver: 0,
  freezesAvailable: 0,
  freezesUsed: 0,
  lastActivityDate: "",
  recoveryAvailable: false,
};

function dateStr(d: Date): string {
  return d.toDateString();
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr(d);
}

function daysBetween(d1: string, d2: string): number {
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  return Math.floor(Math.abs(t2 - t1) / 86400000);
}

export function updateStreak(
  current: EnhancedStreak,
  activityDate: Date,
): EnhancedStreak {
  const today = dateStr(activityDate);
  const streak = { ...current };

  if (streak.lastActivityDate === today) {
    return streak;
  }

  const isConsecutive = streak.lastActivityDate === yesterday();
  const missedDays = streak.lastActivityDate
    ? daysBetween(streak.lastActivityDate, today) - 1
    : 0;

  if (isConsecutive || streak.lastActivityDate === "") {
    streak.currentDays += 1;
  } else if (missedDays === 1 && streak.recoveryAvailable) {
    streak.currentDays += 2;
    streak.recoveryAvailable = false;
    streak.recoveryDeadline = undefined;
  } else if (missedDays === 1 && streak.freezesAvailable > 0) {
    streak.freezesAvailable -= 1;
    streak.freezesUsed += 1;
    streak.currentDays += 1;
  } else {
    streak.currentDays = 1;
    streak.recoveryAvailable = false;
    streak.recoveryDeadline = undefined;
  }

  if (streak.currentDays % 7 === 0 && streak.freezesAvailable < 3) {
    streak.freezesAvailable += 1;
  }

  if (streak.currentDays > streak.longestEver) {
    streak.longestEver = streak.currentDays;
  }

  streak.lastActivityDate = today;
  return streak;
}

export function checkStreakAtRisk(streak: EnhancedStreak): boolean {
  if (streak.currentDays === 0) return false;
  const now = new Date();
  const hour = now.getHours();
  const todayStr = dateStr(now);
  return hour >= 18 && streak.lastActivityDate !== todayStr;
}

export function getStreakMultiplier(streak: EnhancedStreak): number {
  if (streak.currentDays >= 30) return 1.5;
  if (streak.currentDays >= 14) return 1.3;
  if (streak.currentDays >= 7) return 1.2;
  if (streak.currentDays >= 3) return 1.1;
  return 1.0;
}

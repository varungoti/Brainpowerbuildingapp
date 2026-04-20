import type { ActivityLog } from "../../app/context/AppContext";

export interface WeeklyBondingScore {
  weekStart: string;
  score: number;
  trend: "improving" | "declining" | "stable";
  joyMoments: string[];
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

export function computeWeeklyBondingScore(logs: ActivityLog[]): number {
  if (logs.length === 0) return 0;

  const avgInteraction = mean(logs.map(l => l.interactionQuality ?? 3));
  const avgParticipation = mean(logs.map(l =>
    l.parentParticipation === "active" ? 5
      : l.parentParticipation === "guided" ? 3
        : 1
  ));
  const consistency = Math.min(1, logs.length / 5);
  const joyCount = logs.reduce((sum, l) => sum + (l.joyMoments?.length ?? 0), 0);
  const joyBonus = Math.min(1, joyCount / 3);

  return Math.round(
    avgInteraction * 8 +
    avgParticipation * 4 +
    consistency * 25 +
    joyBonus * 15
  );
}

export function computeBondingHistory(logs: ActivityLog[], childId: string, weeks = 8): WeeklyBondingScore[] {
  const childLogs = logs.filter(l => l.childId === childId && l.completed);
  const weekMap = new Map<string, ActivityLog[]>();

  for (const log of childLogs) {
    const ws = getWeekStart(new Date(log.date));
    const arr = weekMap.get(ws) ?? [];
    arr.push(log);
    weekMap.set(ws, arr);
  }

  const sorted = [...weekMap.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, weeks);
  const scores: WeeklyBondingScore[] = [];
  let prevScore = 0;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const [weekStart, weekLogs] = sorted[i];
    const score = computeWeeklyBondingScore(weekLogs);
    const joyMoments = weekLogs.flatMap(l => l.joyMoments ?? []);
    const trend: WeeklyBondingScore["trend"] =
      i === sorted.length - 1 ? "stable"
        : score > prevScore + 5 ? "improving"
          : score < prevScore - 5 ? "declining"
            : "stable";
    scores.push({ weekStart, score, trend, joyMoments });
    prevScore = score;
  }

  return scores.reverse();
}

export function getBondingInsight(score: number): { emoji: string; label: string; message: string } {
  if (score >= 80) return { emoji: "🌟", label: "Exceptional", message: "Your bonding quality is outstanding! Keep up the amazing interactions." };
  if (score >= 60) return { emoji: "💛", label: "Strong", message: "Great parent-child connection. Small increases in active participation can push even higher." };
  if (score >= 40) return { emoji: "🌱", label: "Growing", message: "Good foundation! Try adding joy moments and more hands-on participation." };
  if (score >= 20) return { emoji: "🤗", label: "Building", message: "Every activity together matters. Focus on being present and following your child's lead." };
  return { emoji: "💡", label: "Starting", message: "Begin with short, focused interactions. Quality over quantity makes the difference." };
}

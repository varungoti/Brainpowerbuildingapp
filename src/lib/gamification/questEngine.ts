import type { ChildProfile, ActivityLog } from "../../app/context/AppContext";
import { BRAIN_REGIONS } from "../../app/data/brainRegions";

export type QuestType = "daily" | "weekly" | "monthly" | "special";

export type QuestCondition =
  | { type: "complete-n"; count: number }
  | { type: "region-n"; region: string; count: number }
  | { type: "streak-days"; days: number }
  | { type: "score-reach"; region: string; score: number }
  | { type: "engagement-avg"; min: number; activities: number };

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  emoji: string;
  target: number;
  progress: number;
  rewardBP: number;
  rewardBadge?: string;
  expiresAt: string;
  condition: QuestCondition;
}

function endOfDay(dateStr: string): string {
  return `${dateStr}T23:59:59.999Z`;
}

function endOfWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() + (7 - d.getDay()));
  return endOfDay(d.toISOString().split("T")[0]);
}

function endOfMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  return endOfDay(d.toISOString().split("T")[0]);
}

function getWeakestRegions(scores: Record<string, number>, count: number) {
  return BRAIN_REGIONS
    .map(r => ({ ...r, score: scores[r.key] ?? 0 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}

export function generateDailyQuests(child: ChildProfile): Quest[] {
  const weakest = getWeakestRegions(child.intelligenceScores, 2);
  const today = new Date().toISOString().split("T")[0];

  return [
    {
      id: `daily-${today}-1`,
      type: "daily",
      title: `Build ${weakest[0].name}`,
      description: `Complete a ${weakest[0].name} activity today`,
      emoji: weakest[0].emoji,
      target: 1,
      progress: 0,
      rewardBP: 15,
      expiresAt: endOfDay(today),
      condition: { type: "region-n", region: weakest[0].key, count: 1 },
    },
    {
      id: `daily-${today}-2`,
      type: "daily",
      title: "Complete 2 activities",
      description: "Build neural connections across regions",
      emoji: "🧠",
      target: 2,
      progress: 0,
      rewardBP: 10,
      expiresAt: endOfDay(today),
      condition: { type: "complete-n", count: 2 },
    },
  ];
}

export function generateWeeklyQuests(child: ChildProfile): Quest[] {
  const weakest = getWeakestRegions(child.intelligenceScores, 3);
  return [
    {
      id: `weekly-${Date.now()}-1`,
      type: "weekly",
      title: "5-Activity Streak",
      description: "Complete activities on 5 different days this week",
      emoji: "🔥",
      target: 5,
      progress: 0,
      rewardBP: 50,
      rewardBadge: "weekly_warrior",
      expiresAt: endOfWeek(),
      condition: { type: "streak-days", days: 5 },
    },
    {
      id: `weekly-${Date.now()}-2`,
      type: "weekly",
      title: `Boost ${weakest[1]?.name ?? "a region"}`,
      description: `Complete 3 ${weakest[1]?.name ?? "targeted"} activities this week`,
      emoji: weakest[1]?.emoji ?? "🎯",
      target: 3,
      progress: 0,
      rewardBP: 35,
      expiresAt: endOfWeek(),
      condition: { type: "region-n", region: weakest[1]?.key ?? "", count: 3 },
    },
  ];
}

export function generateMonthlyQuests(_child: ChildProfile): Quest[] {
  return [
    {
      id: `monthly-${Date.now()}-1`,
      type: "monthly",
      title: "Brain Explorer",
      description: "Complete activities across 10 different brain regions",
      emoji: "🌍",
      target: 10,
      progress: 0,
      rewardBP: 100,
      rewardBadge: "brain_explorer",
      expiresAt: endOfMonth(),
      condition: { type: "complete-n", count: 20 },
    },
    {
      id: `monthly-${Date.now()}-2`,
      type: "monthly",
      title: "Engagement Star",
      description: "Maintain 4+ average engagement across 10 activities",
      emoji: "⭐",
      target: 10,
      progress: 0,
      rewardBP: 75,
      rewardBadge: "engagement_star",
      expiresAt: endOfMonth(),
      condition: { type: "engagement-avg", min: 4, activities: 10 },
    },
  ];
}

export function evaluateQuestProgress(quest: Quest, logs: ActivityLog[], childId: string): number {
  const childLogs = logs.filter(l => l.childId === childId && l.completed);
  const questStart = quest.type === "daily"
    ? quest.id.split("-").slice(1, 4).join("-")
    : undefined;

  const relevantLogs = questStart
    ? childLogs.filter(l => l.date.startsWith(questStart))
    : childLogs;

  const cond = quest.condition;
  switch (cond.type) {
    case "complete-n":
      return Math.min(quest.target, relevantLogs.length);
    case "region-n":
      return Math.min(quest.target, relevantLogs.filter(l => l.intelligences.includes(cond.region)).length);
    case "streak-days": {
      const days = new Set(relevantLogs.map(l => new Date(l.date).toDateString()));
      return Math.min(quest.target, days.size);
    }
    case "score-reach":
      return 0;
    case "engagement-avg": {
      const highEngagement = relevantLogs.filter(l => l.engagementRating >= cond.min);
      return Math.min(quest.target, highEngagement.length);
    }
    default:
      return 0;
  }
}

export function isQuestExpired(quest: Quest): boolean {
  return new Date(quest.expiresAt).getTime() < Date.now();
}

export function isQuestComplete(quest: Quest): boolean {
  return quest.progress >= quest.target;
}

import type { ActivityLog, ChildProfile } from "../../app/context/AppContext";

export interface RegionCoverage {
  region: string;
  activitiesCount: number;
  totalMinutes: number;
  avgEngagement: number;
  intelligences: string[];
}

export interface WeeklyReportData {
  childName: string;
  childAge: number;
  weekStart: string;
  weekEnd: string;
  totalActivities: number;
  totalMinutes: number;
  avgEngagement: number;
  regionCoverage: RegionCoverage[];
  coveredRegions: number;
  totalRegions: number;
  topIntelligences: string[];
  streakDays: number;
  brainPoints: number;
  level: number;
  highlights: string[];
  recommendations: string[];
}

const ALL_REGIONS = ["Frontal", "Temporal", "Parietal", "Occipital", "Limbic", "Cerebellum", "Prefrontal", "Brain Stem", "Corpus Callosum", "Hippocampus", "Amygdala", "Thalamus", "Hypothalamus", "Basal Ganglia", "Wernicke"];

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function childAgeInYears(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function buildWeeklyReport(
  child: ChildProfile,
  allLogs: ActivityLog[],
  referenceDate: Date = new Date(),
): WeeklyReportData {
  const { start, end } = getWeekBounds(referenceDate);
  const weekLogs = allLogs.filter(l =>
    l.childId === child.id &&
    l.completed &&
    new Date(l.date) >= start &&
    new Date(l.date) <= end,
  );

  const byRegion = new Map<string, ActivityLog[]>();
  for (const log of weekLogs) {
    const arr = byRegion.get(log.region) ?? [];
    arr.push(log);
    byRegion.set(log.region, arr);
  }

  const regionCoverage: RegionCoverage[] = ALL_REGIONS.map(region => {
    const logs = byRegion.get(region) ?? [];
    const intels = new Set<string>();
    logs.forEach(l => l.intelligences.forEach(i => intels.add(i)));
    return {
      region,
      activitiesCount: logs.length,
      totalMinutes: logs.reduce((s, l) => s + l.duration, 0),
      avgEngagement: logs.length > 0
        ? logs.reduce((s, l) => s + l.engagementRating, 0) / logs.length
        : 0,
      intelligences: [...intels],
    };
  });

  const totalMinutes = weekLogs.reduce((s, l) => s + l.duration, 0);
  const avgEngagement = weekLogs.length > 0
    ? weekLogs.reduce((s, l) => s + l.engagementRating, 0) / weekLogs.length
    : 0;

  const intelCount: Record<string, number> = {};
  weekLogs.forEach(l => l.intelligences.forEach(i => {
    intelCount[i] = (intelCount[i] ?? 0) + 1;
  }));
  const topIntelligences = Object.entries(intelCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  const coveredRegions = regionCoverage.filter(r => r.activitiesCount > 0).length;

  const uniqueDays = new Set(weekLogs.map(l => l.date.slice(0, 10)));
  const highlights: string[] = [];
  if (weekLogs.length >= 7) highlights.push("Completed an activity every day this week!");
  if (coveredRegions >= 5) highlights.push(`Explored ${coveredRegions} brain regions — well-rounded week!`);
  const highEng = weekLogs.filter(l => l.engagementRating >= 4);
  if (highEng.length > 0) highlights.push(`${highEng.length} high-engagement activities`);

  const recommendations: string[] = [];
  const uncovered = regionCoverage.filter(r => r.activitiesCount === 0).map(r => r.region);
  if (uncovered.length > 0) {
    recommendations.push(`Try activities targeting: ${uncovered.slice(0, 3).join(", ")}`);
  }
  if (avgEngagement < 3.5) {
    recommendations.push("Consider adjusting difficulty — try easier activities to build confidence");
  }

  return {
    childName: child.name,
    childAge: childAgeInYears(child.dob),
    weekStart: start.toISOString().slice(0, 10),
    weekEnd: end.toISOString().slice(0, 10),
    totalActivities: weekLogs.length,
    totalMinutes,
    avgEngagement: Math.round(avgEngagement * 10) / 10,
    regionCoverage,
    coveredRegions,
    totalRegions: ALL_REGIONS.length,
    topIntelligences,
    streakDays: uniqueDays.size,
    brainPoints: child.brainPoints,
    level: child.level,
    highlights,
    recommendations,
  };
}

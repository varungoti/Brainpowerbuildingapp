export type Season = "summer" | "monsoon" | "autumn" | "winter" | "spring";

interface SeasonConfig {
  season: Season;
  months: number[];
  emoji: string;
  label: string;
}

const INDIA_SEASONS: SeasonConfig[] = [
  { season: "summer", months: [3, 4, 5], emoji: "☀️", label: "Summer" },
  { season: "monsoon", months: [6, 7, 8, 9], emoji: "🌧️", label: "Monsoon" },
  { season: "autumn", months: [10, 11], emoji: "🍂", label: "Autumn" },
  { season: "winter", months: [12, 1, 2], emoji: "❄️", label: "Winter" },
];

const NORTHERN_HEMISPHERE: SeasonConfig[] = [
  { season: "spring", months: [3, 4, 5], emoji: "🌸", label: "Spring" },
  { season: "summer", months: [6, 7, 8], emoji: "☀️", label: "Summer" },
  { season: "autumn", months: [9, 10, 11], emoji: "🍂", label: "Autumn" },
  { season: "winter", months: [12, 1, 2], emoji: "❄️", label: "Winter" },
];

export function detectSeason(date: Date = new Date(), region: "india" | "northern" = "india"): SeasonConfig {
  const month = date.getMonth() + 1;
  const configs = region === "india" ? INDIA_SEASONS : NORTHERN_HEMISPHERE;
  return configs.find(s => s.months.includes(month)) ?? configs[0];
}

export function getSeasonalTags(season: Season): string[] {
  const map: Record<Season, string[]> = {
    summer: ["outdoor", "water-play", "shade-activities", "summer"],
    monsoon: ["indoor", "rainy-day", "sensory-water", "monsoon"],
    autumn: ["nature-walk", "harvest", "leaf-crafts", "autumn"],
    winter: ["cozy", "warm-activities", "holiday-crafts", "winter"],
    spring: ["garden", "nature", "outdoor", "spring"],
  };
  return map[season];
}

export function seasonMatchScore(activitySeasonalTags: string[] | undefined, currentSeason: Season): number {
  if (!activitySeasonalTags || activitySeasonalTags.length === 0) return 0;
  const seasonTags = getSeasonalTags(currentSeason);
  const matches = activitySeasonalTags.filter(t => seasonTags.includes(t)).length;
  return matches * 8;
}

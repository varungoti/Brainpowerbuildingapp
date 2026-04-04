import type { Activity } from "./activities";

export interface SeasonalOverride {
  seasonalTags: string[];
  seasonalBoost: number;
  seasonalVariant?: Partial<Pick<Activity, "materials" | "instructions" | "description">>;
}

export const SEASONAL_OVERRIDES: Record<string, Record<string, SeasonalOverride>> = {
  summer: {
    a01: {
      seasonalTags: ["summer", "outdoor"],
      seasonalBoost: 10,
      seasonalVariant: {
        description: "Summer edition: Try this outdoors with warm water for a refreshing sensory experience!",
      },
    },
    a08: {
      seasonalTags: ["summer", "water-play"],
      seasonalBoost: 15,
    },
  },
  monsoon: {
    a05: {
      seasonalTags: ["monsoon", "indoor", "rainy-day"],
      seasonalBoost: 12,
    },
    a15: {
      seasonalTags: ["monsoon", "sensory-water"],
      seasonalBoost: 10,
    },
  },
  winter: {
    a03: {
      seasonalTags: ["winter", "cozy", "warm-activities"],
      seasonalBoost: 12,
    },
    a10: {
      seasonalTags: ["winter", "holiday-crafts"],
      seasonalBoost: 10,
    },
  },
  autumn: {
    a12: {
      seasonalTags: ["autumn", "nature-walk", "leaf-crafts"],
      seasonalBoost: 12,
    },
  },
  spring: {
    a06: {
      seasonalTags: ["spring", "garden", "nature"],
      seasonalBoost: 12,
    },
  },
};

export function getSeasonalBoostForActivity(
  activityId: string,
  season: string,
): number {
  return SEASONAL_OVERRIDES[season]?.[activityId]?.seasonalBoost ?? 0;
}

export function getSeasonalVariant(
  activity: Activity,
  season: string,
): Activity {
  const override = SEASONAL_OVERRIDES[season]?.[activity.id];
  if (!override?.seasonalVariant) return activity;
  return {
    ...activity,
    ...override.seasonalVariant,
    seasonalTags: [...(activity.seasonalTags ?? []), ...override.seasonalTags],
  };
}

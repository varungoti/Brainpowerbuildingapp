import type { CommunityRatingCache } from "../../app/context/AppContext";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_PROJECT_ID
  ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/server`
  : "";

export function communityScoreBonus(
  activityId: string,
  cache: CommunityRatingCache | null,
): number {
  if (!cache) return 0;
  const entry = cache.ratings[activityId];
  if (!entry || entry.count < 3) return 0;
  return Math.round((entry.avg - 3) * 4);
}

export async function submitRating(
  activityId: string,
  rating: number,
  userId: string,
): Promise<{ avg: number; count: number } | null> {
  if (!SUPABASE_URL) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rate-activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId, rating, userId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? { avg: data.avg, count: data.count } : null;
  } catch {
    return null;
  }
}

export async function fetchRatings(
  activityIds: string[],
): Promise<Record<string, { avg: number; count: number }>> {
  if (!SUPABASE_URL || activityIds.length === 0) return {};
  try {
    const res = await fetch(
      `${SUPABASE_URL}/activity-ratings?ids=${activityIds.join(",")}`,
    );
    if (!res.ok) return {};
    const data = await res.json();
    return data.success ? data.ratings : {};
  } catch {
    return {};
  }
}

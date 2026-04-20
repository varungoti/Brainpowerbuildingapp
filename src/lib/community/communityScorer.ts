import type { CommunityRatingCache } from "../../app/context/AppContext";
import { functionsBaseUrl, isSupabaseConfigured, publicAnonKey } from "../../utils/supabase/info";
import { getSupabaseBrowserClient } from "../../utils/supabase/client";

export function communityScoreBonus(
  activityId: string,
  cache: CommunityRatingCache | null,
): number {
  if (!cache) return 0;
  const entry = cache.ratings[activityId];
  if (!entry || entry.count < 3) return 0;
  return Math.round((entry.avg - 3) * 4);
}

async function getUserAccessToken(): Promise<string | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Submit a per-user rating for an activity. Requires the caller to be signed in
 * with Supabase Auth — the Edge Function verifies the JWT and derives userId from it.
 */
export async function submitRating(
  activityId: string,
  rating: number,
): Promise<{ avg: number; count: number } | null> {
  if (!isSupabaseConfigured() || !functionsBaseUrl) return null;
  const token = await getUserAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(`${functionsBaseUrl}/rate-activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: publicAnonKey,
      },
      body: JSON.stringify({ activityId, rating }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.success ? { avg: data.avg, count: data.count } : null;
  } catch {
    return null;
  }
}

/** Public read — uses the anon key so unauthenticated visitors still see aggregate ratings. */
export async function fetchRatings(
  activityIds: string[],
): Promise<Record<string, { avg: number; count: number }>> {
  if (!isSupabaseConfigured() || !functionsBaseUrl || activityIds.length === 0) return {};
  const ids = activityIds.filter((id) => /^[a-zA-Z0-9_-]{1,64}$/.test(id)).slice(0, 100);
  if (ids.length === 0) return {};
  try {
    const res = await fetch(
      `${functionsBaseUrl}/activity-ratings?ids=${encodeURIComponent(ids.join(","))}`,
      {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
          apikey: publicAnonKey,
        },
      },
    );
    if (!res.ok) return {};
    const data = await res.json();
    return data?.success && data.ratings && typeof data.ratings === "object"
      ? (data.ratings as Record<string, { avg: number; count: number }>)
      : {};
  } catch {
    return {};
  }
}

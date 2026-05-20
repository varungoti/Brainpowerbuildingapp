import { getSupabaseBrowserClient } from "../../utils/supabase/client";

const SERVER_FN_PATH = "/functions/v1/server";

export interface CoverageSummary {
  totalSeconds: number;
  windowHours: number;
  byPartner: Array<{ partnerId: string; slug: string; displayName: string; seconds: number; events: number }>;
  data: Array<{ partnerId: string; partnerName: string; childId: string; durationSeconds: number; brainRegion: string | null; modality: string; signedAt: string }>;
}

async function authHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase?.auth.getSession() ?? { data: { session: null } };
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function baseUrl(): string {
  const env = (import.meta.env.VITE_EDGE_BASE_URL ?? "") as string;
  return env || "";
}

export async function fetchCoverageSummary(opts: { childId?: string; hours?: number } = {}): Promise<CoverageSummary | null> {
  try {
    const params = new URLSearchParams();
    if (opts.childId) params.set("childId", opts.childId);
    if (opts.hours) params.set("hours", String(opts.hours));
    const r = await fetch(`${baseUrl()}${SERVER_FN_PATH}/coverage/summary?${params.toString()}`, {
      headers: await authHeaders(),
    });
    if (!r.ok) return null;
    return r.json() as Promise<CoverageSummary>;
  } catch {
    return null;
  }
}

/**
 * Survivor 4 — client-side persistence for the sleep signal.
 *
 * Reads + writes go through the Edge Function so we get RLS for free. We
 * also keep a local mirror in `localStorage` so the AGE has a signal
 * before the network round-trip resolves.
 */
import { getSupabaseBrowserClient } from "../../utils/supabase/client";
import { type SleepBucket, type SleepNight, type SleepSource } from "./sleepSignal";

const SERVER_FN_PATH = "/functions/v1/server";
const LOCAL_KEY = (childId: string) => `neurospark.sleep.${childId}`;

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

/** Local mirror — last 14 nights, used by AGE on cold-start. */
export function getLocalSleepMirror(childId: string): SleepNight[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY(childId));
    return raw ? (JSON.parse(raw) as SleepNight[]) : [];
  } catch {
    return [];
  }
}

function setLocalSleepMirror(childId: string, nights: SleepNight[]): void {
  if (typeof localStorage === "undefined") return;
  const trimmed = nights
    .slice()
    .sort((a, b) => b.nightDate.localeCompare(a.nightDate))
    .slice(0, 14);
  localStorage.setItem(LOCAL_KEY(childId), JSON.stringify(trimmed));
}

export async function logSleepNight(input: {
  childId: string;
  nightDate: string;
  bucket: SleepBucket;
  source?: SleepSource;
  /** Optional raw minutes — server stores as `minutes_slept`. */
  minutesSlept?: number;
  /** Optional awakening count. */
  awakenings?: number;
}): Promise<boolean> {
  const local = getLocalSleepMirror(input.childId).filter((n) => n.nightDate !== input.nightDate);
  local.push({
    childId: input.childId,
    nightDate: input.nightDate,
    bucket: input.bucket,
    source: input.source ?? "manual",
  });
  setLocalSleepMirror(input.childId, local);

  const r = await fetch(`${baseUrl()}${SERVER_FN_PATH}/sleep/log`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({
      childId: input.childId,
      nightDate: input.nightDate,
      bucket: input.bucket,
      source: input.source ?? "manual",
      minutesSlept: input.minutesSlept,
      awakenings: input.awakenings,
    }),
  });
  return r.ok;
}

export async function listSleepNights(childId: string, limit = 14): Promise<SleepNight[]> {
  try {
    const r = await fetch(
      `${baseUrl()}${SERVER_FN_PATH}/sleep/list?childId=${encodeURIComponent(childId)}&limit=${limit}`,
      { headers: await authHeaders() },
    );
    if (!r.ok) return getLocalSleepMirror(childId);
    const j = (await r.json()) as { data?: SleepNight[] };
    const data = j.data ?? [];
    setLocalSleepMirror(childId, data);
    return data;
  } catch {
    return getLocalSleepMirror(childId);
  }
}

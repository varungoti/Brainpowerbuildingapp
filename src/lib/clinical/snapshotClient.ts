import { getSupabaseBrowserClient } from "../../utils/supabase/client";
import type { WellChildSnapshotData } from "./wellChildSnapshot";

const SERVER_FN_PATH = "/functions/v1/server";

export interface SnapshotListItem {
  id: string;
  child_id: string;
  generated_at: string;
  anchor_months: number;
  child_age_months: number;
  total_practice_minutes: number;
}

export interface PartnerShare {
  id: string;
  child_id: string;
  token: string;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
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

function ageMonths(dob: string): number {
  const b = new Date(dob);
  const n = new Date();
  return (n.getFullYear() - b.getFullYear()) * 12 + (n.getMonth() - b.getMonth());
}

export async function saveSnapshot(d: WellChildSnapshotData): Promise<{ id: string; generatedAt: string } | null> {
  const r = await fetch(`${baseUrl()}${SERVER_FN_PATH}/snapshot/save`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({
      childId: d.child.id,
      anchorMonths: d.anchor,
      childAgeMonths: ageMonths(d.child.dob),
      posteriors: d.predictions,
      topRegions: d.topRegions,
      underservedRegions: d.underservedRegions,
      totalPracticeMinutes: d.totalPracticeMinutes,
    }),
  });
  if (!r.ok) return null;
  return r.json() as Promise<{ id: string; generatedAt: string }>;
}

export async function listSnapshots(childId?: string): Promise<SnapshotListItem[]> {
  const qs = childId ? `?childId=${encodeURIComponent(childId)}` : "";
  const r = await fetch(`${baseUrl()}${SERVER_FN_PATH}/snapshot/list${qs}`, { headers: await authHeaders() });
  if (!r.ok) return [];
  const j = (await r.json()) as { data?: SnapshotListItem[] };
  return j.data ?? [];
}

export async function listPartnerShares(childId?: string): Promise<PartnerShare[]> {
  const qs = childId ? `?childId=${encodeURIComponent(childId)}` : "";
  const r = await fetch(`${baseUrl()}${SERVER_FN_PATH}/partners/shares${qs}`, { headers: await authHeaders() });
  if (!r.ok) return [];
  const j = (await r.json()) as { data?: PartnerShare[] };
  return j.data ?? [];
}

export async function createPartnerShare(childId: string, ttlDays = 30): Promise<{ token: string; expiresInDays: number } | null> {
  const r = await fetch(`${baseUrl()}${SERVER_FN_PATH}/partners/share`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ childId, ttlDays }),
  });
  if (!r.ok) return null;
  return r.json() as Promise<{ token: string; expiresInDays: number }>;
}

export async function revokePartnerShare(token: string): Promise<boolean> {
  const r = await fetch(`${baseUrl()}${SERVER_FN_PATH}/partners/share/${encodeURIComponent(token)}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return r.ok;
}

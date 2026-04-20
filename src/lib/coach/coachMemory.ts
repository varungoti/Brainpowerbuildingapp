/**
 * Survivor 1 — Companion Coach client utilities.
 *
 * Thin client for the coach_memory + coach/rupture endpoints. Strips raw
 * non-developmental content (PII heuristics, profanity sketch) before upload.
 */

import { getSupabaseBrowserClient } from "../../utils/supabase/client";

const SERVER_FN_PATH = "/functions/v1/server";

export type CoachMemoryTopic =
  | "sleep" | "meltdown" | "rupture-repair" | "milestone" | "language"
  | "social" | "sibling" | "school" | "health" | "emotion" | "curiosity" | "other";

export interface CoachMemory {
  id: number;
  observation: string;
  topic: CoachMemoryTopic;
  weight: number;
  created_at: string;
}

export interface RuptureScript {
  title: string;
  script: string[];
  followUpAfterCalm: string[];
  disclaimer: string;
}

/** Crude PII strip — phone, SSN-shaped, and email sequences. */
export function sanitiseObservation(text: string): string {
  return text
    .replace(/\b\d{3}[-\s.]?\d{2}[-\s.]?\d{4}\b/g, "[redacted]")
    .replace(/(?:(?<=^)|(?<=\s))\+?\d[\d\s().-]{7,}\d(?=\s|$)/g, "[redacted]")
    .replace(/\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 800);
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

export async function logCoachMemory(input: {
  childId: string;
  observation: string;
  topic?: CoachMemoryTopic;
  weight?: number;
}): Promise<{ id: number } | null> {
  const observation = sanitiseObservation(input.observation);
  if (!observation) return null;
  const r = await fetch(`${baseUrl()}${SERVER_FN_PATH}/coach/memory`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({
      childId: input.childId,
      observation,
      topic: input.topic ?? "other",
      weight: input.weight ?? 1,
    }),
  });
  if (!r.ok) return null;
  return r.json() as Promise<{ id: number }>;
}

export async function listCoachMemory(childId: string): Promise<CoachMemory[]> {
  const r = await fetch(`${baseUrl()}${SERVER_FN_PATH}/coach/memory?childId=${encodeURIComponent(childId)}`, {
    headers: await authHeaders(),
  });
  if (!r.ok) return [];
  const j = (await r.json()) as { data?: CoachMemory[] };
  return j.data ?? [];
}

export async function deleteCoachMemory(id: number): Promise<boolean> {
  const r = await fetch(`${baseUrl()}${SERVER_FN_PATH}/coach/memory/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  return r.ok;
}

export async function startRuptureRepair(input: {
  childId?: string;
  childAgeMonths: number;
  childName?: string;
  trigger?: string;
}): Promise<RuptureScript | null> {
  const r = await fetch(`${baseUrl()}${SERVER_FN_PATH}/coach/rupture`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(input),
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { data?: RuptureScript };
  return j.data ?? null;
}

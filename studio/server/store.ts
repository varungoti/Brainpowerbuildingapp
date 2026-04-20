import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { StudioJob } from "./types.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _client: SupabaseClient | null = null;
function client(): SupabaseClient {
  if (!_client) {
    if (!url || !key) throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set");
    _client = createClient(url, key, { auth: { persistSession: false } });
  }
  return _client;
}

export async function ensureSchema(): Promise<void> {
  // Schema is created via supabase migration 00011_studio_jobs.sql; this is a noop.
}

export async function saveJob(job: StudioJob): Promise<void> {
  const c = client();
  const { error } = await c.from("studio_jobs").upsert(
    {
      id: job.id,
      template: job.template,
      brief: job.brief,
      duration_sec: job.durationSec,
      voice: job.voice,
      variant: job.variant,
      status: job.status,
      title: job.title,
      subtitle: job.subtitle,
      scenes: job.scenes,
      voiceover_url: job.voiceoverUrl,
      storyboard_url: job.storyboardUrl,
      mp4_url: job.mp4Url,
      thumbnail_url: job.thumbnailUrl,
      cost_usd: job.costUSD,
      error: job.error,
      updated_at: new Date().toISOString(),
      approved_at: job.approvedAt,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`saveJob failed: ${error.message}`);
}

export async function loadJob(id: string): Promise<StudioJob | null> {
  const c = client();
  const { data, error } = await c.from("studio_jobs").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`loadJob failed: ${error.message}`);
  if (!data) return null;
  return rowToJob(data as Record<string, unknown>);
}

export async function listJobs(limit = 50): Promise<StudioJob[]> {
  const c = client();
  const { data, error } = await c
    .from("studio_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listJobs failed: ${error.message}`);
  return (data ?? []).map((d) => rowToJob(d as Record<string, unknown>));
}

function rowToJob(r: Record<string, unknown>): StudioJob {
  return {
    id: r.id as string,
    template: r.template as StudioJob["template"],
    brief: r.brief as string,
    durationSec: Number(r.duration_sec ?? 0),
    voice: r.voice as string,
    variant: (r.variant ?? "light") as "light" | "dark",
    status: r.status as StudioJob["status"],
    title: (r.title as string) ?? undefined,
    subtitle: (r.subtitle as string) ?? undefined,
    scenes: (r.scenes as StudioJob["scenes"]) ?? [],
    voiceoverUrl: (r.voiceover_url as string) ?? undefined,
    storyboardUrl: (r.storyboard_url as string) ?? undefined,
    mp4Url: (r.mp4_url as string) ?? undefined,
    thumbnailUrl: (r.thumbnail_url as string) ?? undefined,
    costUSD: Number(r.cost_usd ?? 0),
    error: (r.error as string) ?? undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    approvedAt: (r.approved_at as string) ?? undefined,
  };
}

export async function uploadAsset(
  bucket: string,
  path: string,
  body: Buffer | Blob,
  contentType: string,
): Promise<string> {
  const c = client();
  const { error } = await c.storage.from(bucket).upload(path, body, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`uploadAsset failed: ${error.message}`);
  const { data } = c.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

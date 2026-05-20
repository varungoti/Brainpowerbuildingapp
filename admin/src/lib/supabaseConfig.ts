/**
 * Resolves Supabase + edge URLs for the admin SPA.
 * Accepts either VITE_SUPABASE_URL or VITE_SUPABASE_PROJECT_ID (full URL or project ref),
 * matching the parent app’s `.env.local` shape.
 */

function normalizeSupabaseUrl(raw: string | undefined): string {
  const v = raw?.trim() ?? "";
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v.replace(/\/+$/, "");
  return `https://${v}.supabase.co`;
}

export function getSupabaseUrl(): string {
  const direct = import.meta.env.VITE_SUPABASE_URL?.trim();
  if (direct) return normalizeSupabaseUrl(direct);
  return normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_PROJECT_ID);
}

export function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

/** Hono `server` edge function — hosts `/admin/*` routes. */
export function getEdgeBaseUrl(): string {
  const explicit = import.meta.env.VITE_EDGE_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const url = getSupabaseUrl();
  if (!url) return "";
  return `${url}/functions/v1/server`;
}

export function getMarketingOsBase(): string {
  const explicit = import.meta.env.VITE_MARKETING_OS_BASE?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const url = getSupabaseUrl();
  if (!url) return "";
  return `${url}/functions/v1/marketing-os`;
}

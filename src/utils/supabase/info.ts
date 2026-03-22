/**
 * Supabase project configuration.
 * `VITE_SUPABASE_PROJECT_ID` may be either a full project URL
 * (`https://your-project.supabase.co`) or just the project ref.
 */
const rawProjectValue = import.meta.env.VITE_SUPABASE_PROJECT_ID?.trim() ?? "";
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

function normalizeSupabaseUrl(value: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value.replace(/\/+$/, "");
  return `https://${value}.supabase.co`;
}

const supabaseUrl = normalizeSupabaseUrl(rawProjectValue);
const projectId = supabaseUrl
  ? supabaseUrl.replace(/^https?:\/\//i, "").replace(/\.supabase\.co$/i, "")
  : "";
const functionsBaseUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/make-server-76b0ba9a` : "";

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && publicAnonKey);
}

export { rawProjectValue, projectId, publicAnonKey, supabaseUrl, functionsBaseUrl };

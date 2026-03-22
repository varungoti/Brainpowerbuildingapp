/**
 * Supabase project configuration for Edge Function calls.
 * Set VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY in .env
 */
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "";
const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export { projectId, publicAnonKey };

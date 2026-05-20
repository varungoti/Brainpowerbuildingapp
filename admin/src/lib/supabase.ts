import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./supabaseConfig.ts";

const url = getSupabaseUrl();
const key = getSupabaseAnonKey();

if (!isSupabaseConfigured()) {
  console.error(
    "admin: Set VITE_SUPABASE_URL (or VITE_SUPABASE_PROJECT_ID) and VITE_SUPABASE_ANON_KEY. " +
      "On Vercel: Project Settings → Environment Variables for neurospark-admin.",
  );
}

export const supabase = createClient(
  url || "https://invalid.supabase.co",
  key || "missing-anon-key",
  { auth: { persistSession: true, autoRefreshToken: true } },
);

export { isSupabaseConfigured };

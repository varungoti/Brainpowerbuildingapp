import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.warn("admin: VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY not set");
}
export const supabase = createClient(url ?? "http://localhost", key ?? "anon");

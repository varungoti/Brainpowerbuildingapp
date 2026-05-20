// Shared Supabase admin client for Marketing OS functions.
// All marketing tables are service-role-only — see migration 00018.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

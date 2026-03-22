import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, publicAnonKey, supabaseUrl } from "./info";

let singleton: SupabaseClient | null | undefined;

export function isSupabaseAuthConfigured(): boolean {
  return isSupabaseConfigured();
}

/** Browser client with isolated storage key so it doesn't clash with app JSON. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseAuthConfigured()) return null;
  if (singleton === undefined) {
    singleton = createClient(supabaseUrl, publicAnonKey, {
      auth: {
        persistSession: true,
        storageKey: "neurospark_sb_auth",
        autoRefreshToken: true,
      },
    });
  }
  return singleton;
}

export async function signOutSupabase(): Promise<void> {
  const c = getSupabaseBrowserClient();
  if (c) await c.auth.signOut();
}

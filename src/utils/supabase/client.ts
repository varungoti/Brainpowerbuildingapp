import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

let singleton: SupabaseClient | null | undefined;

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(projectId && publicAnonKey);
}

/** Browser client with isolated storage key so it doesn't clash with app JSON. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseAuthConfigured()) return null;
  if (singleton === undefined) {
    const url = `https://${projectId}.supabase.co`;
    singleton = createClient(url, publicAnonKey, {
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

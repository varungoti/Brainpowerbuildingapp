import { supabase } from "./supabase.ts";
import { getMarketingOsBase } from "./supabaseConfig.ts";

export const MARKETING_OS_BASE = getMarketingOsBase();

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function marketingApi<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${MARKETING_OS_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`marketing-os ${path} ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

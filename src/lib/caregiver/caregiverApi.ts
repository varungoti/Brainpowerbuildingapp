// ============================================================================
// caregiverApi — talks to /caregivers/invite + /caregivers/accept Edge Function
// ----------------------------------------------------------------------------
// Local-first model: the existing AppContext already keeps a list of
// CaregiverLink rows. This module is the optional cloud bridge for sharing
// access across separate accounts (a co-parent on a different device).
// ============================================================================

import { functionsBaseUrl, publicAnonKey } from "../../utils/supabase/info";
import { getSupabaseBrowserClient } from "../../utils/supabase/client";

export type CaregiverScope = "view" | "log_only" | "co_parent";

export interface InviteResult {
  ok: boolean;
  token?: string;
  expiresInDays?: number;
  errorMessage?: string;
}

export interface AcceptResult {
  ok: boolean;
  childId?: string;
  scope?: CaregiverScope;
  errorMessage?: string;
}

async function getJwt(): Promise<string | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function createCaregiverInvite(childId: string, scope: CaregiverScope): Promise<InviteResult> {
  const jwt = await getJwt();
  if (!jwt || !functionsBaseUrl) return { ok: false, errorMessage: "not_signed_in" };
  try {
    const resp = await fetch(`${functionsBaseUrl.replace("/make-server-76b0ba9a", "")}/caregivers/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
        apikey: publicAnonKey,
      },
      body: JSON.stringify({ childId, scope }),
    });
    if (!resp.ok) return { ok: false, errorMessage: `HTTP ${resp.status}` };
    const json = (await resp.json()) as { token: string; expiresInDays: number };
    return { ok: true, token: json.token, expiresInDays: json.expiresInDays };
  } catch (e) {
    return { ok: false, errorMessage: (e as Error).message };
  }
}

export async function acceptCaregiverInvite(token: string): Promise<AcceptResult> {
  const jwt = await getJwt();
  if (!jwt || !functionsBaseUrl) return { ok: false, errorMessage: "not_signed_in" };
  try {
    const resp = await fetch(`${functionsBaseUrl.replace("/make-server-76b0ba9a", "")}/caregivers/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
        apikey: publicAnonKey,
      },
      body: JSON.stringify({ token: token.trim() }),
    });
    if (!resp.ok) {
      const body = (await resp.json().catch(() => ({}))) as { error?: string };
      return { ok: false, errorMessage: body.error ?? `HTTP ${resp.status}` };
    }
    const json = (await resp.json()) as { childId: string; scope: CaregiverScope };
    return { ok: true, childId: json.childId, scope: json.scope };
  } catch (e) {
    return { ok: false, errorMessage: (e as Error).message };
  }
}

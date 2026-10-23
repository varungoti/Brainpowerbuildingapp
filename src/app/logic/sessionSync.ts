import type { Session } from "@supabase/supabase-js";
import type { AppPersistedState, AppView, User } from "../context/AppContext";
import { initializeCloudSyncOwnership, withCloudSyncAccount } from "../../lib/sync/cloudSyncOwnership";

export function getSessionDisplayName(user: NonNullable<Session["user"]>): string {
  return (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) || (user.email?.split("@")[0] ?? "Parent");
}

export function buildUserFromSession(session: Session | null, nowIso = new Date().toISOString()): User | null {
  const user = session?.user;
  const email = user?.email;
  if (!user || !email) return null;

  return {
    id: user.id,
    email,
    name: getSessionDisplayName(user),
    createdAt: user.created_at ?? nowIso,
    supabaseUid: user.id,
  };
}

export function syncPersistedSessionUser(
  prev: AppPersistedState,
  session: Session | null,
  nowIso = new Date().toISOString(),
): AppPersistedState {
  const nextUser = buildUserFromSession(session, nowIso);
  if (!nextUser) return prev;

  const owned = withCloudSyncAccount(prev, nextUser.supabaseUid ?? null);

  const existingUser = prev.user;
  if (existingUser && existingUser.supabaseUid === nextUser.supabaseUid) {
    if (existingUser.email === nextUser.email && existingUser.name === nextUser.name
      && prev.cloudSyncOwnerId === owned.cloudSyncOwnerId && prev.cloudSyncQuarantined === owned.cloudSyncQuarantined) return prev;
    return { ...owned, user: { ...existingUser, email: nextUser.email, name: nextUser.name } };
  }

  if (existingUser) return owned;
  return { ...owned, user: nextUser };
}

export function clearPersistedRemoteSession(prev: AppPersistedState): AppPersistedState {
  if (!prev.user?.supabaseUid) return prev;
  return {
    ...initializeCloudSyncOwnership(prev),
    user: null,
    children: [],
    activeChildId: null,
    activityLogs: [],
    lastPackGeneratedOn: null,
    outcomeChecklists: {},
    kycData: {},
    milestoneChecks: {},
  };
}

export function getViewAfterSessionSync(view: AppView, options?: { hasChildren?: boolean }): AppView {
  if (view === "landing" || view === "auth") {
    return options?.hasChildren === false ? "onboard_welcome" : "home";
  }
  return view;
}

export function consumeCreditBalance(credits: number): { ok: boolean; credits: number } {
  if (credits <= 0) return { ok: false, credits };
  return { ok: true, credits: credits - 1 };
}

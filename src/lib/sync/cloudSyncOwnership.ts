import type { AppPersistedState } from "../../app/context/AppContext";

/** Unknown or derived family collections must never be silently assigned to a new account. */
function hasRetainedFamilyData(state: AppPersistedState): boolean {
  const metadata = new Set(["user", "cloudSyncOwnerId", "cloudSyncQuarantined", "materialInventory", "locale"]);
  return Object.entries(state).some(([key, value]) => {
    if (metadata.has(key) || value == null || value === false || value === 0 || value === "") return false;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  });
}

/** A legacy current-user label alone is not proof of retained family ownership. */
export function initializeCloudSyncOwnership(state: AppPersistedState): AppPersistedState {
  const owner = state.cloudSyncOwnerId;
  const ownerId = typeof owner === "string" && owner.trim() ? owner : null;
  const malformed = owner != null && ownerId === null;
  const unownedData = !ownerId && (!!state.user || hasRetainedFamilyData(state));
  const mismatchedUser = !!ownerId && !!state.user && state.user.supabaseUid !== ownerId;
  const malformedQuarantine = state.cloudSyncQuarantined !== undefined && typeof state.cloudSyncQuarantined !== "boolean";
  return {
    ...state,
    cloudSyncOwnerId: ownerId,
    cloudSyncQuarantined: state.cloudSyncQuarantined === true || malformed || malformedQuarantine || unownedData || mismatchedUser,
  };
}

/** Preserve provenance through login. A different account cannot relabel retained data. */
export function withCloudSyncAccount(state: AppPersistedState, nextOwnerId: string | null): AppPersistedState {
  const current = initializeCloudSyncOwnership(state);
  const changesOwner = !!current.cloudSyncOwnerId && current.cloudSyncOwnerId !== nextOwnerId;
  const quarantined = current.cloudSyncQuarantined === true || changesOwner;
  return {
    ...current,
    cloudSyncOwnerId: current.cloudSyncOwnerId ?? (quarantined ? null : nextOwnerId),
    cloudSyncQuarantined: quarantined,
  };
}

export function getCloudSyncSnapshotOwner(state: AppPersistedState): string | null {
  const current = initializeCloudSyncOwnership(state);
  if (current.cloudSyncQuarantined || current.cloudSyncOwnerId !== current.user?.supabaseUid) return null;
  return current.cloudSyncOwnerId ?? null;
}

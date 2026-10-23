import { describe, expect, it } from "vitest";
import type { AppPersistedState, User } from "../../app/context/AppContext";
import type { Session } from "@supabase/supabase-js";
import { clearPersistedRemoteSession, syncPersistedSessionUser } from "../../app/logic/sessionSync";
import { buildNeurosparkBackupFile, parseNeurosparkBackupFile } from "../../utils/neurosparkBackup";
import { getCloudSyncSnapshotOwner, initializeCloudSyncOwnership, withCloudSyncAccount } from "./cloudSyncOwnership";

const user = (id: string): User => ({ id, supabaseUid: id, email: `${id}@example.test`, name: "Synthetic Parent", createdAt: "2026-10-23" });
const session = (id: string) => ({ user: { id, email: `${id}@example.test`, user_metadata: {}, created_at: "2026-10-23" } }) as Session;
const empty = (): AppPersistedState => ({
  user: null, children: [], activeChildId: null, activityLogs: [], materialInventory: ["paper"], credits: 0,
  lastPackGeneratedOn: null, kycData: {}, outcomeChecklists: {}, milestoneChecks: {}, adaptiveModel: null,
  reportHistory: [], siblingGroups: [], collaborationLogs: [], portfolioEntries: [], locale: "en",
  sensoryProfiles: {}, communityRatingCache: null, routineConfig: null, quests: [], enhancedStreak: null,
  notificationPrefs: null, usagePattern: null, caregivers: [], bondingScores: [], narrativeCache: {},
});

describe("cloud sync family provenance", () => {
  it("binds an empty new family to its first authenticated account", () => {
    const current = syncPersistedSessionUser(empty(), session("account-a"));
    expect(current.cloudSyncOwnerId).toBe("account-a");
    expect(getCloudSyncSnapshotOwner(current)).toBe("account-a");
    const family = { ...current, narrativeCache: { week: "New synthetic A report" } };
    expect(getCloudSyncSnapshotOwner(initializeCloudSyncOwnership(JSON.parse(JSON.stringify(family))))).toBe("account-a");
  });

  it("quarantines legacy signed-in data rather than trusting its current-user label", () => {
    const current = initializeCloudSyncOwnership({ ...empty(), user: user("account-a"), narrativeCache: { week: "Synthetic A report" } });
    expect(current.cloudSyncQuarantined).toBe(true);
    expect(getCloudSyncSnapshotOwner(current)).toBeNull();
  });

  it("quarantines legacy signed-out derived data instead of assigning it to the next login", () => {
    const current = syncPersistedSessionUser({ ...empty(), narrativeCache: { week: "Unknown synthetic family" } }, session("account-b"));
    expect(current.cloudSyncQuarantined).toBe(true);
    expect(current.narrativeCache.week).toBe("Unknown synthetic family");
    expect(getCloudSyncSnapshotOwner(current)).toBeNull();
  });

  it("quarantines the persisted output of the pre-upgrade A logout then B login", () => {
    // Output reproduced using the exact sessionSync helpers at 8fde2bd7f151f10eb09c5e3c234ac286853e496f:
    // clearPersistedRemoteSession(A) retained A's derived collections, then
    // syncPersistedSessionUser(B) replaced only the user. No provenance existed.
    const historical = {
      ...empty(), user: user("account-b"),
      narrativeCache: { week: "Synthetic A report retained by the old version" },
      reportHistory: [{ generatedAt: "2026-10-07", weekStart: "2026-10-01", weekEnd: "2026-10-07" }],
    };
    const upgraded = initializeCloudSyncOwnership(JSON.parse(JSON.stringify(historical)));
    expect(upgraded.cloudSyncOwnerId).toBeNull();
    expect(upgraded.cloudSyncQuarantined).toBe(true);
    expect(upgraded.narrativeCache).toEqual(historical.narrativeCache);
    expect(upgraded.reportHistory).toEqual(historical.reportHistory);
    expect(getCloudSyncSnapshotOwner(syncPersistedSessionUser(upgraded, session("account-b")))).toBeNull();
  });

  it("preserves A's derived data and provenance through logout, B login and re-opt-in eligibility", () => {
    const a = { ...empty(), user: user("account-a"), cloudSyncOwnerId: "account-a", narrativeCache: { week: "Synthetic A report" } };
    const signedOut = clearPersistedRemoteSession(a);
    expect(signedOut.user).toBeNull();
    expect(signedOut.cloudSyncOwnerId).toBe("account-a");
    const b = syncPersistedSessionUser(signedOut, session("account-b"));
    expect(b.user?.supabaseUid).toBe("account-b");
    expect(b.cloudSyncOwnerId).toBe("account-a");
    expect(b.cloudSyncQuarantined).toBe(true);
    expect(b.narrativeCache).toEqual(a.narrativeCache);
    expect(getCloudSyncSnapshotOwner(b)).toBeNull();
    expect(getCloudSyncSnapshotOwner(initializeCloudSyncOwnership(JSON.parse(JSON.stringify(b))))).toBeNull();
  });

  it("permits the same original owner to return after logout without relabeling data", () => {
    const a = { ...empty(), user: user("account-a"), cloudSyncOwnerId: "account-a", narrativeCache: { week: "Synthetic A report" } };
    const returned = syncPersistedSessionUser(clearPersistedRemoteSession(a), session("account-a"));
    expect(getCloudSyncSnapshotOwner(returned)).toBe("account-a");
  });

  it("does not clear quarantine when account A returns after a mixed-owner transition", () => {
    const b = { ...withCloudSyncAccount({ ...empty(), user: user("account-a"), cloudSyncOwnerId: "account-a" }, "account-b"), user: user("account-b") };
    const a = { ...withCloudSyncAccount(b, "account-a"), user: user("account-a") };
    expect(a.cloudSyncOwnerId).toBe("account-a");
    expect(a.cloudSyncQuarantined).toBe(true);
    expect(getCloudSyncSnapshotOwner(a)).toBeNull();
  });

  it("does not assign local-only families to an unrelated remote login", () => {
    const local = { ...empty(), user: { ...user("local"), supabaseUid: undefined } };
    const linked = { ...withCloudSyncAccount(local, "account-b"), user: user("account-b") };
    expect(getCloudSyncSnapshotOwner(linked)).toBeNull();
    expect(linked.cloudSyncQuarantined).toBe(true);
  });

  it("quarantines a mismatched persisted user even if its quarantine field was missing", () => {
    const current = initializeCloudSyncOwnership({ ...empty(), cloudSyncOwnerId: "account-a", user: user("account-b") });
    expect(current.cloudSyncQuarantined).toBe(true);
    expect(getCloudSyncSnapshotOwner({ ...current, user: user("account-a") })).toBeNull();
  });

  it("keeps backup provenance but never treats imported ownership as verified", () => {
    const current = { ...empty(), user: user("account-a"), cloudSyncOwnerId: "account-a", cloudSyncQuarantined: false };
    const result = parseNeurosparkBackupFile(buildNeurosparkBackupFile(current));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Synthetic backup should parse");
    expect(result.payload.cloudSyncOwnerId).toBe("account-a");
    expect(result.payload.cloudSyncQuarantined).toBe(true);
    expect(getCloudSyncSnapshotOwner(result.payload)).toBeNull();
  });
});

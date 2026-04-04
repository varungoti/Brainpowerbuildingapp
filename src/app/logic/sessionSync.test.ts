import { describe, expect, it } from "vitest";
import type { Session } from "@supabase/supabase-js";
import type { AppPersistedState } from "../context/AppContext";
import {
  buildUserFromSession,
  clearPersistedRemoteSession,
  consumeCreditBalance,
  getViewAfterSessionSync,
  syncPersistedSessionUser,
} from "./sessionSync";

const baseState = (): AppPersistedState => ({
  user: null,
  children: [],
  activeChildId: null,
  activityLogs: [],
  materialInventory: ["paper"],
  credits: 2,
  lastPackGeneratedOn: null,
  kycData: {},
  outcomeChecklists: {},
  milestoneChecks: {},
  adaptiveModel: null,
  reportHistory: [],
  siblingGroups: [],
  collaborationLogs: [],
  portfolioEntries: [],
  locale: "en",
  sensoryProfiles: {},
  communityRatingCache: null,
});

const session = (overrides?: Partial<NonNullable<Session["user"]>>): Session =>
  ({
    access_token: "token",
    refresh_token: "refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 123,
    user: {
      id: "sb-1",
      email: "parent@example.com",
      created_at: "2026-03-19T00:00:00.000Z",
      user_metadata: { full_name: "Parent One" },
      app_metadata: {},
      aud: "authenticated",
      ...overrides,
    },
  }) as Session;

describe("sessionSync helpers", () => {
  it("builds a local user from a supabase session", () => {
    const user = buildUserFromSession(session(), "2026-03-20T00:00:00.000Z");
    expect(user).toMatchObject({
      id: "sb-1",
      email: "parent@example.com",
      name: "Parent One",
      supabaseUid: "sb-1",
    });
  });

  it("syncs a new supabase session into empty persisted state", () => {
    const next = syncPersistedSessionUser(baseState(), session());
    expect(next.user?.email).toBe("parent@example.com");
    expect(next.user?.supabaseUid).toBe("sb-1");
  });

  it("updates matching supabase user metadata without overwriting local-only families", () => {
    const prev: AppPersistedState = {
      ...baseState(),
      user: {
        id: "sb-1",
        email: "old@example.com",
        name: "Old Name",
        createdAt: "2026-03-19T00:00:00.000Z",
        supabaseUid: "sb-1",
      },
    };
    const next = syncPersistedSessionUser(prev, session());
    expect(next.user?.email).toBe("parent@example.com");
    expect(next.user?.name).toBe("Parent One");
  });

  it("keeps local-only accounts on remote sign-out events", () => {
    const prev: AppPersistedState = {
      ...baseState(),
      user: {
        id: "local-1",
        email: "local@example.com",
        name: "Local Parent",
        createdAt: "2026-03-19T00:00:00.000Z",
      },
      children: [{ id: "c1", name: "Kid", dob: "2021-01-01", ageTier: 2, avatarEmoji: "🦁", avatarColor: "#000", brainPoints: 0, level: 0, streak: 0, lastStreakDate: "", badges: [], totalActivities: 0, intelligenceScores: {} }],
    };
    expect(clearPersistedRemoteSession(prev)).toEqual(prev);
  });

  it("clears supabase-linked family data on remote sign-out", () => {
    const prev: AppPersistedState = {
      ...baseState(),
      user: {
        id: "sb-1",
        email: "parent@example.com",
        name: "Parent One",
        createdAt: "2026-03-19T00:00:00.000Z",
        supabaseUid: "sb-1",
      },
      children: [{ id: "c1", name: "Kid", dob: "2021-01-01", ageTier: 2, avatarEmoji: "🦁", avatarColor: "#000", brainPoints: 0, level: 0, streak: 0, lastStreakDate: "", badges: [], totalActivities: 0, intelligenceScores: {} }],
      activityLogs: [{
        id: "l1",
        childId: "c1",
        activityId: "a1",
        activityName: "Act",
        emoji: "🎯",
        date: "2026-03-19T00:00:00.000Z",
        intelligences: ["Executive Function"],
        method: "Montessori",
        region: "Western",
        regionEmoji: "🇮🇹",
        duration: 10,
        completed: true,
        engagementRating: 4,
        parentNotes: "",
        brainPointsEarned: 50,
      }],
      kycData: { c1: { curiosity: 3, energy: 3, patience: 3, creativity: 3, social: 3, learningStyle: null, energyLevel: 3, adaptability: 3, mood: 3, sensitivity: 3, notes: "", updatedAt: "2026-03-19T00:00:00.000Z" } },
      outcomeChecklists: { c1: [] },
      milestoneChecks: { c1: ["m001"] },
    };
    const next = clearPersistedRemoteSession(prev);
    expect(next.user).toBeNull();
    expect(next.children).toHaveLength(0);
    expect(next.activityLogs).toHaveLength(0);
    expect(next.kycData).toEqual({});
    expect(next.lastPackGeneratedOn).toBeNull();
    expect(next.milestoneChecks).toEqual({});
  });

  it("computes credit consumption and post-session views safely", () => {
    expect(consumeCreditBalance(2)).toEqual({ ok: true, credits: 1 });
    expect(consumeCreditBalance(0)).toEqual({ ok: false, credits: 0 });
    expect(getViewAfterSessionSync("landing", { hasChildren: true })).toBe("home");
    expect(getViewAfterSessionSync("auth", { hasChildren: false })).toBe("onboard_welcome");
    expect(getViewAfterSessionSync("profile")).toBe("profile");
  });
});

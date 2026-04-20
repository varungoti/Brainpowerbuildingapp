import { describe, it, expect } from "vitest";
import type { AppPersistedState } from "../app/context/AppContext";
import {
  buildNeurosparkBackupFile,
  parseNeurosparkBackupFile,
  NEUROSPARK_BACKUP_FORMAT,
  NEUROSPARK_BACKUP_VERSION,
} from "./neurosparkBackup";

const minimalState = (): AppPersistedState => ({
  user: null,
  children: [],
  activeChildId: null,
  activityLogs: [],
  materialInventory: ["paper"],
  credits: 0,
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
  routineConfig: null,
  quests: [],
  enhancedStreak: null,
  notificationPrefs: null,
  usagePattern: null,
  caregivers: [],
  bondingScores: [],
  narrativeCache: {},
});

describe("neurosparkBackup", () => {
  it("round-trips wrapped backup", () => {
    const s = minimalState();
    const raw = buildNeurosparkBackupFile(s);
    const parsed = JSON.parse(raw) as { format: string; version: number; payload: unknown };
    expect(parsed.format).toBe(NEUROSPARK_BACKUP_FORMAT);
    expect(parsed.version).toBe(NEUROSPARK_BACKUP_VERSION);
    const r = parseNeurosparkBackupFile(raw);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.children).toEqual([]);
      expect(r.payload.materialInventory).toContain("paper");
    }
  });

  it("accepts raw persisted JSON (legacy)", () => {
    const s = minimalState();
    const r = parseNeurosparkBackupFile(JSON.stringify(s));
    expect(r.ok).toBe(true);
  });

  it("rejects garbage", () => {
    expect(parseNeurosparkBackupFile("not json").ok).toBe(false);
    expect(parseNeurosparkBackupFile("{}").ok).toBe(false);
  });

  it("fixes activeChildId when missing child", () => {
    const s: AppPersistedState = {
      ...minimalState(),
      children: [
        {
          id: "c1",
          name: "A",
          dob: "2020-01-01",
          ageTier: 2,
          avatarEmoji: "🦁",
          avatarColor: "#000",
          brainPoints: 0,
          level: 0,
          streak: 0,
          lastStreakDate: "",
          badges: [],
          totalActivities: 0,
          intelligenceScores: {},
        },
      ],
      activeChildId: "ghost",
    };
    const r = parseNeurosparkBackupFile(JSON.stringify(s));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.activeChildId).toBe("c1");
  });
});

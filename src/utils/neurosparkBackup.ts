import type {
  ActivityLog,
  AppPersistedState,
  ChildProfile,
  KYCData,
  User,
} from "../app/context/AppContext";
import type { OutcomeChecklistMonth } from "../app/data/outcomeChecklist";

export const NEUROSPARK_BACKUP_FORMAT = "neurospark_backup" as const;
export const NEUROSPARK_BACKUP_VERSION = 1 as const;

const DEFAULT_MATERIALS = ["paper", "pencils", "cups", "water", "outdoor", "blanket", "spoons"] as const;

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isUser(x: unknown): x is User | null {
  if (x === null) return true;
  if (!isRecord(x)) return false;
  return (
    typeof x.id === "string" &&
    typeof x.email === "string" &&
    typeof x.name === "string" &&
    typeof x.createdAt === "string" &&
    (x.supabaseUid === undefined || typeof x.supabaseUid === "string")
  );
}

function isChildProfile(x: unknown): x is ChildProfile {
  if (!isRecord(x)) return false;
  if (
    typeof x.id !== "string" ||
    typeof x.name !== "string" ||
    typeof x.dob !== "string" ||
    typeof x.ageTier !== "number" ||
    typeof x.avatarEmoji !== "string" ||
    typeof x.avatarColor !== "string" ||
    typeof x.brainPoints !== "number" ||
    typeof x.level !== "number" ||
    typeof x.streak !== "number" ||
    typeof x.lastStreakDate !== "string" ||
    !Array.isArray(x.badges) ||
    typeof x.totalActivities !== "number" ||
    !isRecord(x.intelligenceScores)
  ) {
    return false;
  }
  if (!x.badges.every((b) => typeof b === "string")) return false;
  for (const v of Object.values(x.intelligenceScores)) {
    if (typeof v !== "number") return false;
  }
  return true;
}

function isActivityLog(x: unknown): x is ActivityLog {
  if (!isRecord(x)) return false;
  return (
    typeof x.id === "string" &&
    typeof x.childId === "string" &&
    typeof x.activityId === "string" &&
    typeof x.activityName === "string" &&
    typeof x.emoji === "string" &&
    typeof x.date === "string" &&
    Array.isArray(x.intelligences) &&
    x.intelligences.every((i) => typeof i === "string") &&
    typeof x.method === "string" &&
    typeof x.region === "string" &&
    typeof x.regionEmoji === "string" &&
    typeof x.duration === "number" &&
    typeof x.completed === "boolean" &&
    typeof x.engagementRating === "number" &&
    typeof x.parentNotes === "string" &&
    typeof x.brainPointsEarned === "number"
  );
}

function isLearningStyle(x: unknown): x is KYCData["learningStyle"] {
  return x === null || x === "visual" || x === "auditory" || x === "kinesthetic";
}

function isKYCData(x: unknown): x is KYCData {
  if (!isRecord(x)) return false;
  const ls = x.learningStyle;
  if (!isLearningStyle(ls)) return false;
  return (
    typeof x.curiosity === "number" &&
    typeof x.energy === "number" &&
    typeof x.patience === "number" &&
    typeof x.creativity === "number" &&
    typeof x.social === "number" &&
    typeof x.energyLevel === "number" &&
    typeof x.adaptability === "number" &&
    typeof x.mood === "number" &&
    typeof x.sensitivity === "number" &&
    typeof x.notes === "string" &&
    typeof x.updatedAt === "string"
  );
}

function isOutcomeMonth(x: unknown): x is OutcomeChecklistMonth {
  if (!isRecord(x)) return false;
  if (typeof x.monthKey !== "string" || typeof x.submittedAt !== "string" || typeof x.compositeScore !== "number")
    return false;
  if (!isRecord(x.answers)) return false;
  for (const v of Object.values(x.answers)) {
    if (typeof v !== "number") return false;
  }
  return true;
}

function isMilestoneChecksRecord(x: unknown): x is Record<string, string[]> {
  if (x === undefined) return true;
  if (!isRecord(x)) return false;
  for (const arr of Object.values(x)) {
    if (!Array.isArray(arr) || !arr.every((id) => typeof id === "string")) return false;
  }
  return true;
}

function isAppPersistedState(x: unknown): x is AppPersistedState {
  if (!isRecord(x)) return false;
  if (!isUser(x.user)) return false;
  if (!Array.isArray(x.children) || !x.children.every(isChildProfile)) return false;
  if (x.activeChildId !== null && typeof x.activeChildId !== "string") return false;
  if (!Array.isArray(x.activityLogs) || !x.activityLogs.every(isActivityLog)) return false;
  if (!Array.isArray(x.materialInventory) || !x.materialInventory.every((m) => typeof m === "string")) return false;
  if (typeof x.credits !== "number") return false;
  if (x.lastPackGeneratedOn !== null && x.lastPackGeneratedOn !== undefined && typeof x.lastPackGeneratedOn !== "string") return false;
  if (!isRecord(x.kycData)) return false;
  for (const v of Object.values(x.kycData)) {
    if (!isKYCData(v)) return false;
  }
  if (!isRecord(x.outcomeChecklists)) return false;
  for (const arr of Object.values(x.outcomeChecklists)) {
    if (!Array.isArray(arr) || !arr.every(isOutcomeMonth)) return false;
  }
  if (!isMilestoneChecksRecord(x.milestoneChecks)) return false;
  return true;
}

function normalizePersisted(
  p: AppPersistedState & { milestoneChecks?: Record<string, string[]> },
): AppPersistedState {
  const childIds = new Set(p.children.map((c) => c.id));
  const activeOk = p.activeChildId !== null && childIds.has(p.activeChildId);
  const activeChildId = activeOk ? p.activeChildId : (p.children[0]?.id ?? null);
  const milestoneChecks = Object.fromEntries(
    Object.entries(p.milestoneChecks ?? {})
      .filter(([childId, ids]) => childIds.has(childId) && Array.isArray(ids))
      .map(([childId, ids]) => [childId, ids.filter((id): id is string => typeof id === "string")]),
  );

  return {
    user: p.user,
    children: p.children,
    activeChildId,
    activityLogs: p.activityLogs,
    materialInventory: p.materialInventory.length ? p.materialInventory : [...DEFAULT_MATERIALS],
    credits: Number.isFinite(p.credits) ? p.credits : 0,
    lastPackGeneratedOn: p.lastPackGeneratedOn ?? null,
    kycData: p.kycData ?? {},
    outcomeChecklists: p.outcomeChecklists ?? {},
    milestoneChecks,
    adaptiveModel: (p as unknown as Record<string, unknown>).adaptiveModel as AppPersistedState["adaptiveModel"] ?? null,
    reportHistory: ((p as unknown as Record<string, unknown>).reportHistory as AppPersistedState["reportHistory"]) ?? [],
    siblingGroups: ((p as unknown as Record<string, unknown>).siblingGroups as AppPersistedState["siblingGroups"]) ?? [],
    collaborationLogs: ((p as unknown as Record<string, unknown>).collaborationLogs as AppPersistedState["collaborationLogs"]) ?? [],
    portfolioEntries: ((p as unknown as Record<string, unknown>).portfolioEntries as AppPersistedState["portfolioEntries"]) ?? [],
    locale: ((p as unknown as Record<string, unknown>).locale as AppPersistedState["locale"]) ?? "en",
    sensoryProfiles: ((p as unknown as Record<string, unknown>).sensoryProfiles as AppPersistedState["sensoryProfiles"]) ?? {},
    communityRatingCache: (p as unknown as Record<string, unknown>).communityRatingCache as AppPersistedState["communityRatingCache"] ?? null,
  };
}

export function buildNeurosparkBackupFile(state: AppPersistedState): string {
  const body = {
    format: NEUROSPARK_BACKUP_FORMAT,
    version: NEUROSPARK_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    payload: state,
  };
  return JSON.stringify(body, null, 2);
}

export function parseNeurosparkBackupFile(
  raw: string,
): { ok: true; payload: AppPersistedState } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }

  let candidate: unknown = data;
  if (isRecord(data) && data.format === NEUROSPARK_BACKUP_FORMAT) {
    if (data.version !== NEUROSPARK_BACKUP_VERSION) {
      return { ok: false, error: `Unsupported backup version (expected ${NEUROSPARK_BACKUP_VERSION}).` };
    }
    candidate = data.payload;
  }

  if (!isAppPersistedState(candidate)) {
    return {
      ok: false,
      error: "This file is not a NeuroSpark backup (or it is damaged).",
    };
  }

  return { ok: true, payload: normalizePersisted(candidate) };
}

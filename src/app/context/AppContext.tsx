import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { Activity, getAgeTierFromDob, ACTIVITIES } from "../data/activities";
import {
  applyCompetencyDeltas,
  competencyDeltasFromLog,
  inferCompetencyTags,
  type AIAgeCompetencyId,
} from "../../lib/competencies/aiAgeCompetencies";
import { currentMonthKey, computeComposite, type OutcomeChecklistMonth } from "../data/outcomeChecklist";
import { getSupabaseBrowserClient, signOutSupabase } from "../../utils/supabase/client";
import { captureProductEvent } from "../../utils/productAnalytics";
import { buildNeurosparkBackupFile, parseNeurosparkBackupFile } from "../../utils/neurosparkBackup";
import { trainFromLogs } from "../../lib/ml/adaptiveEngine";
import { clearPersistedRemoteSession, consumeCreditBalance, getViewAfterSessionSync, syncPersistedSessionUser } from "../logic/sessionSync";
import { canAccessBlueprint } from "../../utils/adminAccess";
import { isCloudSyncEnabled, pushStateDebounced } from "../../lib/sync/cloudSync";
export type { OutcomeChecklistMonth } from "../data/outcomeChecklist";

// ─── Types ─────────────────────────────────────────────────────────────────────
export type AppView =
  | "landing" | "auth"
  | "onboard_welcome" | "onboard_child" | "onboard_materials" | "onboard_ready"
  | "home" | "generate" | "pack_result" | "activity_detail"
  | "history" | "stats" | "profile" | "add_child" | "blueprint" | "feeds"
  | "paywall" | "year_plan" | "ai_counselor"
  | "brain_map" | "know_your_child" | "milestones"
  | "legal_info"
  | "weekly_report" | "sibling_mode" | "portfolio"
  | "settings_language" | "settings_sensory" | "seasonal_library"
  | "bonding" | "routine" | "caregivers" | "quests" | "settings_notifications"
  | "ai_privacy" | "audio_mode"
  | "coach_memory" | "rupture_repair" | "sleep_log" | "snapshot" | "snapshot_shares";

export interface KYCData {
  curiosity: number;
  energy: number;
  patience: number;
  creativity: number;
  social: number;
  learningStyle: "visual" | "auditory" | "kinesthetic" | null;
  energyLevel: number;
  adaptability: number;
  mood: number;
  sensitivity: number;
  notes: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  /** Set when signed in via Supabase Auth */
  supabaseUid?: string;
}
export interface ChildProfile {
  id: string;
  name: string;
  dob: string;
  ageTier: number;
  avatarEmoji: string;
  avatarColor: string;
  brainPoints: number;
  level: number;
  streak: number;
  lastStreakDate: string;
  badges: string[];
  totalActivities: number;
  intelligenceScores: Record<string, number>;
  /**
   * AI-Age Readiness competency scores (parallel to `intelligenceScores`).
   * Keys are `AIAgeCompetencyId`. Optional for back-compat with legacy stored
   * profiles — `load()` defaults to `{}` and the recommendation engine treats
   * missing dimensions as score 0 (i.e. highest priority).
   */
  competencyScores?: Record<string, number>;
}
export type SensoryCondition =
  | "adhd" | "asd" | "visual-impairment" | "hearing-impairment"
  | "sensory-processing" | "fine-motor-delay" | "anxiety";

export interface SensoryProfile {
  type: "neurotypical" | "sensory-seeking" | "sensory-avoiding" | "mixed";
  conditions: SensoryCondition[];
  modifications: string[];
}

export type SupportedLocale =
  | "en" | "hi" | "ta" | "te" | "kn" | "ml" | "bn" | "mr" | "gu" | "pa" | "or" | "as" | "ur"
  | "zh-CN" | "ja" | "ko"
  | "es" | "fr" | "pt" | "de" | "it" | "nl" | "ru" | "pl"
  | "ar" | "tr" | "sw" | "fa"
  | "th" | "vi" | "id" | "ms";

export interface AdaptiveRegionRecommendation {
  recommendedTier: 1 | 2 | 3;
  confidenceScore: number;
  sampleCount: number;
  lastUpdated: string;
}

export interface AdaptiveModel {
  regionWeights: Record<string, number>;
  recommendations: Record<string, AdaptiveRegionRecommendation>;
  lastTrainedAt: string;
  version: number;
  /**
   * Per-AI-Age-competency engagement multipliers (centred at 1.0).
   * Phase D — drives `getAdaptiveCompetencyBonus` so the engine prefers
   * dimensions where the child shows higher engagement when there is a tie.
   */
  competencyWeights?: Record<string, number>;
}

export interface ReportHistoryEntry {
  generatedAt: string;
  weekStart: string;
  weekEnd: string;
}

export interface SiblingGroup {
  id: string;
  childIds: string[];
  name: string;
  createdAt: string;
}

export interface CollaborationLog {
  logId: string;
  groupId: string;
  childIds: string[];
  activityId: string;
  completedAt: string;
}

export interface PortfolioEntry {
  id: string;
  childId: string;
  imageDataUrl: string;
  activityId?: string;
  intelligences: string[];
  tags: string[];
  caption: string;
  createdAt: string;
  stage: "sensorimotor" | "preoperational" | "concrete-operational" | "formal-operational";
  includeInReport: boolean;
}

export interface CommunityRatingCache {
  ratings: Record<string, { avg: number; count: number }>;
  fetchedAt: string;
}

export interface RoutineConfig {
  wakeTime: string;
  napStart?: string;
  napEnd?: string;
  bedTime: string;
  energyPattern: "morning-peak" | "afternoon-peak" | "even" | "unknown";
}

export type QuestType = "daily" | "weekly" | "monthly" | "special";
export type QuestCondition =
  | { type: "complete-n"; count: number }
  | { type: "region-n"; region: string; count: number }
  | { type: "streak-days"; days: number }
  | { type: "score-reach"; region: string; score: number }
  | { type: "engagement-avg"; min: number; activities: number };

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  emoji: string;
  target: number;
  progress: number;
  rewardBP: number;
  rewardBadge?: string;
  expiresAt: string;
  condition: QuestCondition;
}

export interface EnhancedStreak {
  currentDays: number;
  longestEver: number;
  freezesAvailable: number;
  freezesUsed: number;
  lastActivityDate: string;
  recoveryAvailable: boolean;
  recoveryDeadline?: string;
}

export type NotificationType =
  | "daily-reminder" | "streak-at-risk" | "milestone-approaching"
  | "report-ready" | "quest-expiring";

export interface NotificationPrefs {
  enabled: boolean;
  maxPerDay: number;
  quietStart: string;
  quietEnd: string;
  types: Record<NotificationType, boolean>;
}

export interface UsagePattern {
  hourBuckets: number[];
  dayBuckets: number[];
  avgSessionMinutes: number;
  lastActiveAt: string;
}

export interface CaregiverLink {
  id: string;
  userId: string;
  childId: string;
  role: "primary" | "caregiver" | "observer";
  invitedBy: string;
  acceptedAt?: string;
  displayName: string;
  email: string;
}

export interface WeeklyBondingScore {
  weekStart: string;
  score: number;
  trend: "improving" | "declining" | "stable";
  joyMoments: string[];
}

export interface ActivityLog {
  id: string;
  childId: string;
  activityId: string;
  activityName: string;
  emoji: string;
  date: string;
  intelligences: string[];
  method: string;
  region: string;
  regionEmoji: string;
  duration: number;
  completed: boolean;
  engagementRating: number;
  parentNotes: string;
  brainPointsEarned: number;
  difficultyTier?: 1 | 2 | 3;
  completionTimeSeconds?: number;
  attemptsBeforeComplete?: number;
  siblingGroupId?: string;
  collaboratingChildIds?: string[];
  interactionQuality?: 1 | 2 | 3 | 4 | 5;
  parentParticipation?: "active" | "guided" | "observed";
  joyMoments?: string[];
  /** AI-Age competency tags inferred at log time so adaptive engine can train. */
  competencyTags?: string[];
}

export interface GeneratorIntent {
  source: "milestone_concern" | "ai_age_focus";
  title: string;
  note: string;
  suggestedMood?: string;
  priorityIntelligences: string[];
  /**
   * Optional AI-Age Readiness competencies to emphasize. Set when the
   * "Practice today's focus" CTA on HomeScreen routes the user into the
   * generator with the child's two weakest dimensions pre-selected.
   */
  priorityCompetencies?: AIAgeCompetencyId[];
}

// ─── Level system ──────────────────────────────────────────────────────────────
export const LEVEL_CONFIG = [
  { level:0, name:"Seedling",       emoji:"🌱", threshold:0,    color:"#06D6A0" },
  { level:1, name:"Sprout",         emoji:"🌿", threshold:300,  color:"#2DC653" },
  { level:2, name:"Sapling",        emoji:"🌳", threshold:700,  color:"#FFB703" },
  { level:3, name:"Branch",         emoji:"🌲", threshold:1500, color:"#FB5607" },
  { level:4, name:"Forest Explorer",emoji:"🏔️", threshold:3000, color:"#4361EE" },
  { level:5, name:"Master Grower",  emoji:"🧠", threshold:6000, color:"#7209B7" },
];
export const BADGE_DEFS: Record<string, { label:string; emoji:string; desc:string }> = {
  first_activity:  { label:"First Steps",    emoji:"🌟", desc:"Completed your first activity" },
  week_streak:     { label:"7-Day Streak",   emoji:"🔥", desc:"7 consecutive days of activities" },
  ten_activities:  { label:"Go-Getter",      emoji:"🚀", desc:"Completed 10 activities" },
  all_regions:     { label:"World Explorer", emoji:"🌍", desc:"Tried all 5 cultural traditions" },
  yoga_master:     { label:"Yoga Yogi",      emoji:"🧘", desc:"Completed 5 yoga activities" },
  math_wizard:     { label:"Math Wizard",    emoji:"🔢", desc:"Completed 5 math activities" },
  nature_explorer: { label:"Nature Kid",     emoji:"🌿", desc:"Completed 5 nature activities" },
  creative_genius: { label:"Art Star",       emoji:"🎨", desc:"Completed 5 creative activities" },
};
export const AVATAR_EMOJIS = ["🦁","🐯","🐼","🦊","🐸","🦋","🐧","🦄","🐬","🦅","🦉","🐉"];
export const AVATAR_COLORS = ["#4361EE","#F72585","#06D6A0","#FFB703","#7209B7","#E63946","#0077B6","#2DC653","#FB5607","#118AB2"];

export function getLevelFromBP(bp: number) {
  let lvl = LEVEL_CONFIG[0];
  for (const l of LEVEL_CONFIG) { if (bp >= l.threshold) lvl = l; }
  return lvl;
}
export function getNextLevelBP(bp: number) {
  const cur = getLevelFromBP(bp);
  const next = LEVEL_CONFIG[cur.level + 1];
  return next ? next.threshold : cur.threshold;
}

// ─── Persistence ───────────────────────────────────────────────────────────────
const LS_KEY = "neurospark_v2";
/** Serializable app state (localStorage + backup files). */
export interface AppPersistedState {
  user: User | null;
  children: ChildProfile[];
  activeChildId: string | null;
  activityLogs: ActivityLog[];
  materialInventory: string[];
  credits: number;
  lastPackGeneratedOn: string | null;
  kycData: Record<string, KYCData>;
  outcomeChecklists: Record<string, OutcomeChecklistMonth[]>;
  milestoneChecks: Record<string, string[]>;
  adaptiveModel: AdaptiveModel | null;
  reportHistory: ReportHistoryEntry[];
  siblingGroups: SiblingGroup[];
  collaborationLogs: CollaborationLog[];
  portfolioEntries: PortfolioEntry[];
  locale: SupportedLocale;
  sensoryProfiles: Record<string, SensoryProfile>;
  communityRatingCache: CommunityRatingCache | null;
  routineConfig: RoutineConfig | null;
  quests: Quest[];
  enhancedStreak: EnhancedStreak | null;
  notificationPrefs: NotificationPrefs | null;
  usagePattern: UsagePattern | null;
  caregivers: CaregiverLink[];
  bondingScores: WeeklyBondingScore[];
  narrativeCache: Record<string, string>;
}
type Persisted = AppPersistedState;
const DEFAULTS: Persisted = {
  user: null, children: [], activeChildId: null, activityLogs: [],
  materialInventory: ["paper","pencils","cups","water","outdoor","blanket","spoons"],
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
};
function loadLegacyMilestoneChecks(
  childIds: string[],
  existing: Record<string, string[]> = {},
): Record<string, string[]> {
  const next = { ...existing };
  for (const childId of childIds) {
    if (next[childId]) continue;
    try {
      const raw = localStorage.getItem(`milestones_${childId}`);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        next[childId] = parsed.filter((id): id is string => typeof id === "string");
      }
    } catch {
      // Ignore malformed legacy milestone storage.
    }
  }
  return next;
}
function load(): Persisted {
  try {
    const r = localStorage.getItem(LS_KEY);
    if (!r) return DEFAULTS;
    const parsed = JSON.parse(r) as Partial<Persisted>;
    const childIds = Array.isArray(parsed.children)
      ? parsed.children
          .map((child) => (typeof child?.id === "string" ? child.id : null))
          .filter((id): id is string => id !== null)
      : [];
    return {
      ...DEFAULTS,
      ...parsed,
      lastPackGeneratedOn: typeof parsed.lastPackGeneratedOn === "string" ? parsed.lastPackGeneratedOn : null,
      outcomeChecklists: parsed.outcomeChecklists ?? {},
      milestoneChecks: loadLegacyMilestoneChecks(childIds, parsed.milestoneChecks ?? {}),
    };
  } catch {
    return DEFAULTS;
  }
}
function save(s: Persisted) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* quota / private mode */
  }
}

// ─── Context interface ─────────────────────────────────────────────────────────
interface Ctx extends Persisted {
  view: AppView;
  navigate: (to: AppView) => void;
  goBack: () => void;
  canGoBack: boolean;
  activeChild: ChildProfile | null;
  generatedPack: Activity[] | null;
  setGeneratedPack: (p: Activity[] | null) => void;
  viewingActivity: Activity | null;
  setViewingActivity: (a: Activity | null) => void;
  loginUser: (email: string, name: string, options?: { supabaseUid?: string }) => void;
  logoutUser: () => void;
  addChild: (c: Omit<ChildProfile,"id"|"brainPoints"|"level"|"streak"|"lastStreakDate"|"badges"|"totalActivities"|"intelligenceScores"|"ageTier">) => string;
  setActiveChild: (id: string) => void;
  setMaterialInventory: (m: string[]) => void;
  logActivity: (l: Omit<ActivityLog,"id"|"date"|"brainPointsEarned">) => number;
  updateChildBadges: (childId: string) => void;
  authMode: "login" | "signup";
  setAuthMode: (m: "login" | "signup") => void;
  addCredits: (n: number) => void;
  consumeCredit: () => boolean;
  hasCreditForToday: () => boolean;
  lastPackGeneratedOn: string | null;
  saveKYCData: (childId: string, data: Omit<KYCData, "updatedAt">) => void;
  saveOutcomeChecklist: (childId: string, answers: Record<string, number>) => void;
  toggleMilestoneCheck: (childId: string, milestoneId: string) => void;
  generatorIntent: GeneratorIntent | null;
  setGeneratorIntent: (intent: GeneratorIntent | null) => void;
  clearGeneratorIntent: () => void;
  /** JSON file for backup / moving devices (contains child names & notes — keep private). */
  exportLocalDataBackup: () => string;
  /** Replace all local app data from a backup file. */
  importLocalDataBackup: (json: string) => { ok: true } | { ok: false; error: string };
  setLocale: (locale: SupportedLocale) => void;
  saveSensoryProfile: (childId: string, profile: SensoryProfile) => void;
  saveAdaptiveModel: (model: AdaptiveModel) => void;
  addSiblingGroup: (group: Omit<SiblingGroup, "id" | "createdAt">) => string;
  addCollaborationLog: (log: Omit<CollaborationLog, "logId" | "completedAt">) => void;
  addPortfolioEntry: (entry: Omit<PortfolioEntry, "id" | "createdAt">) => string;
  removePortfolioEntry: (id: string) => void;
  addReportHistoryEntry: (entry: Omit<ReportHistoryEntry, "generatedAt">) => void;
  setCommunityRatingCache: (cache: CommunityRatingCache) => void;
  saveRoutineConfig: (config: RoutineConfig) => void;
  setQuests: (quests: Quest[]) => void;
  setEnhancedStreak: (streak: EnhancedStreak) => void;
  saveNotificationPrefs: (prefs: NotificationPrefs) => void;
  saveUsagePattern: (pattern: UsagePattern) => void;
  addCaregiver: (link: Omit<CaregiverLink, "id">) => void;
  removeCaregiver: (id: string) => void;
  saveNarrativeCache: (weekKey: string, narrative: string) => void;
}
const AppCtx = createContext<Ctx | null>(null);
export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be inside AppProvider");
  return c;
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function AppProvider({ children: ch }: { children: ReactNode }) {
  const [p, setP] = useState<Persisted>(load);
  const [view, setView] = useState<AppView>(() => {
    if (!p.user) return "landing";
    return p.children.length > 0 ? "home" : "onboard_welcome";
  });
  const [hist, setHist] = useState<AppView[]>([]);
  const [generatedPack, setGeneratedPack] = useState<Activity[] | null>(null);
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);
  const [authMode, setAuthMode] = useState<"login"|"signup">("signup");
  const [generatorIntent, setGeneratorIntent] = useState<GeneratorIntent | null>(null);
  const userRef = useRef(p.user);
  useEffect(() => {
    userRef.current = p.user;
  }, [p.user]);
  const pRef = useRef(p);
  useEffect(() => {
    pRef.current = p;
  }, [p]);

  useEffect(() => { save(p); }, [p]);

  // Cloud sync — debounced push on every persisted-state mutation when the
  // user has opted in AND there is an authenticated Supabase session. The
  // transport layer owns the debounce so back-to-back local updates coalesce
  // into a single round-trip.
  useEffect(() => {
    if (!p.user) return;
    if (!isCloudSyncEnabled()) return;
    const client = getSupabaseBrowserClient();
    if (!client) return;
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await client.auth.getSession();
        if (cancelled) return;
        const jwt = data.session?.access_token ?? null;
        if (!jwt) return;
        pushStateDebounced(JSON.parse(buildNeurosparkBackupFile(p)) as unknown, jwt);
      } catch {
        /* ignore — local-first stays correct */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [p]);

  // Supabase: session lifecycle (refresh is automatic via client config), remote sign-out, metadata updates
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const syncFromSession = (session: Session | null) => {
      // setView was previously called INSIDE the setP updater which fires twice in
      // React StrictMode and is considered an unsafe side-effect in reducers.
      // Compute the next persisted state once, apply it, then derive the next view.
      setP((prev) => syncPersistedSessionUser(prev, session));
      setView((v) => {
        const hasChildren =
          syncPersistedSessionUser(pRef.current, session).children.length > 0;
        return getViewAfterSessionSync(v, { hasChildren });
      });
    };

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;

      if (event === "SIGNED_OUT") {
        setP((prev) => clearPersistedRemoteSession(prev));
        setView("landing");
        setHist([]);
        setGeneratedPack(null);
        setViewingActivity(null);
        setGeneratorIntent(null);
        return;
      }

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (event === "INITIAL_SESSION" && !session?.user) return;
        syncFromSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Nudge session check when returning to the tab (helps after sleep / backgrounding)
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const onVis = () => {
      if (document.visibilityState === "visible") void client.auth.getSession();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const upd = (patch: Partial<Persisted>) => setP(prev => ({ ...prev, ...patch }));

  const navigate = useCallback((to: AppView) => {
    let target = to;
    if (to === "blueprint" && !canAccessBlueprint(userRef.current)) {
      target = "profile";
    }
    setHist((h) => [...h, view]);
    setView(target);
  }, [view]);

  const goBack = useCallback(() => {
    setHist(h => {
      if (!h.length) return h;
      setView(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }, []);

  const loginUser = (email: string, name: string, options?: { supabaseUid?: string }) => {
    const uid = options?.supabaseUid;
    const user: User = {
      id: uid ?? Math.random().toString(36).slice(2),
      email,
      name,
      createdAt: new Date().toISOString(),
      supabaseUid: uid,
    };
    setHist([]);
    // Derive the next view from the current persisted state BEFORE committing the
    // user update — putting setView inside the setP updater made it fire twice in
    // StrictMode and could race with other batched state updates.
    const hasChildren = pRef.current.children.length > 0;
    setP((prev) => ({ ...prev, user }));
    setView(hasChildren ? "home" : "onboard_welcome");
  };

  const logoutUser = () => {
    void (async () => {
      try {
        await signOutSupabase();
      } catch (e) {
        console.warn("[NeuroSpark] Supabase signOut failed", e);
      }
      upd({ user: null, children: [], activeChildId: null, activityLogs: [], outcomeChecklists: {}, kycData: {}, milestoneChecks: {}, lastPackGeneratedOn: null });
      setView("landing");
      setHist([]);
      setGeneratedPack(null);
      setViewingActivity(null);
      setGeneratorIntent(null);
    })();
  };

  const addChild = (c: Omit<ChildProfile,"id"|"brainPoints"|"level"|"streak"|"lastStreakDate"|"badges"|"totalActivities"|"intelligenceScores"|"ageTier">) => {
    const id = Math.random().toString(36).slice(2);
    const newChild: ChildProfile = {
      ...c, id, ageTier: getAgeTierFromDob(c.dob), brainPoints: 0, level: 0, streak: 0,
      lastStreakDate: "", badges: [], totalActivities: 0, intelligenceScores: {},
      competencyScores: {},
    };
    const newChildren = [...p.children, newChild];
    upd({ children: newChildren, activeChildId: id });
    return id;
  };

  const setActiveChild = (id: string) => upd({ activeChildId: id });
  const setMaterialInventory = (m: string[]) => upd({ materialInventory: m });

  const logActivity = (log: Omit<ActivityLog,"id"|"date"|"brainPointsEarned">) => {
    const bp = log.completed ? 50 + (log.engagementRating - 1) * 12 : 10;
    const entry: ActivityLog = { ...log, id: Math.random().toString(36).slice(2), date: new Date().toISOString(), brainPointsEarned: bp };
    const today = new Date().toDateString();
    // First-activity funnel: capture whether THIS log brings the active child
    // from 0 → 1 completed activities so the funnel can join `auth_submit_success`
    // → `onboard_complete` → `first_activity_complete` cleanly.
    const wasFirstActivityForChild =
      log.completed &&
      pRef.current.activityLogs.filter(
        (l) => l.childId === log.childId && l.completed,
      ).length === 0;

    // Derive all state updates from `prev` inside a single functional updater so we
    // never mix the freshly-committed activityLogs with a stale closure value when we
    // decide whether to retrain the adaptive model.
    setP((prev) => {
      const nextLogs = [entry, ...prev.activityLogs];
      const nextChildren = prev.children.map(c => {
        if (c.id !== log.childId) return c;
        const newBP = c.brainPoints + bp;
        const newLevel = getLevelFromBP(newBP).level;
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const isConsec = c.lastStreakDate === yesterday.toDateString();
        const isSameDay = c.lastStreakDate === today;
        const newStreak = isSameDay ? c.streak : isConsec ? c.streak + 1 : 1;
        const newIntel = { ...c.intelligenceScores };
        log.intelligences.forEach(i => { newIntel[i] = (newIntel[i] ?? 0) + 1; });
        // AI-Age competency scoring: derive competencies from the activity
        // (or fall back to a heuristic on the log itself when the activity
        // can't be resolved — e.g. legacy logs from before the registry
        // existed). Engagement weights the increment, so consistently-
        // engaged activities push competency up faster than half-hearted ones.
        const sourceActivity = ACTIVITIES.find((a) => a.id === log.activityId);
        const competencyTags: AIAgeCompetencyId[] = sourceActivity?.competencyTags ?? inferCompetencyTags({
          intelligences: log.intelligences,
          method: log.method ?? "",
          skillTags: undefined,
          mechanismTags: undefined,
          duration: log.duration ?? 0,
          ageTiers: [c.ageTier],
          competencyTags: undefined,
        });
        const competencyDelta = competencyDeltasFromLog({
          competencyTags,
          engagementRating: log.engagementRating,
          completed: log.completed,
        });
        const newCompetency = applyCompetencyDeltas(c.competencyScores, competencyDelta);
        const newBadges = [...c.badges];
        const addBadge = (b: string) => { if (!newBadges.includes(b)) newBadges.push(b); };
        if (!newBadges.includes("first_activity")) addBadge("first_activity");
        if (newStreak >= 7) addBadge("week_streak");
        if ((c.totalActivities + 1) >= 10) addBadge("ten_activities");
        return {
          ...c,
          brainPoints: newBP,
          level: newLevel,
          streak: newStreak,
          lastStreakDate: today,
          badges: newBadges,
          totalActivities: c.totalActivities + (log.completed ? 1 : 0),
          intelligenceScores: newIntel,
          competencyScores: newCompetency,
        };
      });

      let nextAdaptive = prev.adaptiveModel;
      if (log.completed) {
        const childCompletedLogs = nextLogs.filter(l => l.childId === log.childId && l.completed);
        if (childCompletedLogs.length > 0 && childCompletedLogs.length % 5 === 0) {
          nextAdaptive = trainFromLogs(childCompletedLogs, prev.adaptiveModel);
        }
      }

      return {
        ...prev,
        activityLogs: nextLogs,
        children: nextChildren,
        adaptiveModel: nextAdaptive,
      };
    });

    if (log.completed) {
      captureProductEvent("activity_complete", {
        primary_intel: log.intelligences[0],
        duration_min: log.duration,
        region: log.region,
        is_first_activity: wasFirstActivityForChild,
      });
      if (wasFirstActivityForChild) {
        captureProductEvent("first_activity_complete", {
          screen: "activity_detail",
          primary_intel: log.intelligences[0],
          duration_min: log.duration,
          region: log.region,
          age_tier: pRef.current.children.find((c) => c.id === log.childId)?.ageTier,
        });
      }
    }
    return bp;
  };

  const updateChildBadges = (childId: string) => {
    const logs = p.activityLogs.filter(l => l.childId === childId);
    const regions = new Set(logs.map(l => l.region));
    const methods = logs.map(l => l.method);
    const newChildren = p.children.map(c => {
      if (c.id !== childId) return c;
      const newBadges = [...c.badges];
      const addBadge = (b: string) => { if (!newBadges.includes(b)) newBadges.push(b); };
      if (regions.size >= 5) addBadge("all_regions");
      if (methods.filter(m => m === "Yoga & Pranayama").length >= 5) addBadge("yoga_master");
      if (methods.filter(m => m.includes("Math") || m.includes("Abacus") || m.includes("Bar")).length >= 5) addBadge("math_wizard");
      if (methods.filter(m => m.includes("Shinrin") || m.includes("Forest")).length >= 5) addBadge("nature_explorer");
      if (methods.filter(m => m.includes("Reggio") || m.includes("Waldorf")).length >= 5) addBadge("creative_genius");
      return { ...c, badges: newBadges };
    });
    upd({ children: newChildren });
  };

  const addCredits = (n: number) => upd({ credits: (p.credits ?? 0) + n });
  const consumeCredit = (): boolean => {
    const today = new Date().toDateString();
    if (p.lastPackGeneratedOn === today) return true;
    const result = consumeCreditBalance(p.credits ?? 0);
    if (!result.ok) return false;
    upd({ credits: result.credits, lastPackGeneratedOn: today });
    return true;
  };
  const hasCreditForToday = (): boolean => p.lastPackGeneratedOn === new Date().toDateString() || (p.credits ?? 0) > 0;

  const saveKYCData = (childId: string, data: Omit<KYCData, "updatedAt">) => {
    const entry: KYCData = { ...data, updatedAt: new Date().toISOString() };
    upd({ kycData: { ...p.kycData, [childId]: entry } });
  };

  const toggleMilestoneCheck = useCallback((childId: string, milestoneId: string) => {
    setP((prev) => {
      const existing = prev.milestoneChecks[childId] ?? [];
      const next = existing.includes(milestoneId)
        ? existing.filter((id) => id !== milestoneId)
        : [...existing, milestoneId];
      return {
        ...prev,
        milestoneChecks: {
          ...prev.milestoneChecks,
          [childId]: next,
        },
      };
    });
  }, []);

  const exportLocalDataBackup = useCallback(() => buildNeurosparkBackupFile(p), [p]);

  const importLocalDataBackup = useCallback((json: string): { ok: true } | { ok: false; error: string } => {
    const parsed = parseNeurosparkBackupFile(json);
    if (!parsed.ok) return parsed;
    const next = parsed.payload;
    setP(next);
    setHist([]);
    setGeneratedPack(null);
    setViewingActivity(null);
    setGeneratorIntent(null);
    setView(next.user ? (next.children.length > 0 ? "home" : "onboard_welcome") : "landing");
    return { ok: true };
  }, []);

  const saveOutcomeChecklist = (childId: string, answers: Record<string, number>) => {
    const monthKey = currentMonthKey();
    const compositeScore = computeComposite(answers);
    const entry: OutcomeChecklistMonth = {
      monthKey,
      answers: { ...answers },
      submittedAt: new Date().toISOString(),
      compositeScore,
    };
    const prev = p.outcomeChecklists[childId] ?? [];
    const withoutThisMonth = prev.filter((x: OutcomeChecklistMonth) => x.monthKey !== monthKey);
    upd({
      outcomeChecklists: {
        ...p.outcomeChecklists,
        [childId]: [...withoutThisMonth, entry],
      },
    });
  };

  const setLocale = (locale: SupportedLocale) => upd({ locale });

  const saveSensoryProfile = (childId: string, profile: SensoryProfile) =>
    upd({ sensoryProfiles: { ...p.sensoryProfiles, [childId]: profile } });

  const saveAdaptiveModel = (model: AdaptiveModel) => upd({ adaptiveModel: model });

  const addSiblingGroup = (g: Omit<SiblingGroup, "id" | "createdAt">): string => {
    const id = crypto.randomUUID();
    upd({ siblingGroups: [...p.siblingGroups, { ...g, id, createdAt: new Date().toISOString() }] });
    return id;
  };

  const addCollaborationLog = (l: Omit<CollaborationLog, "logId" | "completedAt">) =>
    upd({ collaborationLogs: [...p.collaborationLogs, { ...l, logId: crypto.randomUUID(), completedAt: new Date().toISOString() }] });

  const addPortfolioEntry = (e: Omit<PortfolioEntry, "id" | "createdAt">): string => {
    const id = crypto.randomUUID();
    upd({ portfolioEntries: [...p.portfolioEntries, { ...e, id, createdAt: new Date().toISOString() }] });
    return id;
  };

  const removePortfolioEntry = (id: string) =>
    upd({ portfolioEntries: p.portfolioEntries.filter(e => e.id !== id) });

  const addReportHistoryEntry = (e: Omit<ReportHistoryEntry, "generatedAt">) =>
    upd({ reportHistory: [...p.reportHistory, { ...e, generatedAt: new Date().toISOString() }] });

  const setCommunityRatingCache = (cache: CommunityRatingCache) =>
    upd({ communityRatingCache: cache });

  const saveRoutineConfig = (config: RoutineConfig) => upd({ routineConfig: config });
  const setQuests = (quests: Quest[]) => upd({ quests });
  const setEnhancedStreak = (streak: EnhancedStreak) => upd({ enhancedStreak: streak });
  const saveNotificationPrefs = (prefs: NotificationPrefs) => upd({ notificationPrefs: prefs });
  const saveUsagePattern = (pattern: UsagePattern) => upd({ usagePattern: pattern });
  const addCaregiver = (link: Omit<CaregiverLink, "id">) =>
    upd({ caregivers: [...p.caregivers, { ...link, id: crypto.randomUUID() }] });
  const removeCaregiver = (id: string) =>
    upd({ caregivers: p.caregivers.filter(c => c.id !== id) });
  const saveNarrativeCache = (weekKey: string, narrative: string) =>
    upd({ narrativeCache: { ...p.narrativeCache, [weekKey]: narrative } });

  const activeChild = p.children.find(c => c.id === p.activeChildId) ?? null;

  const value: Ctx = {
    ...p, view, navigate, goBack, canGoBack: hist.length > 0, activeChild,
    generatedPack, setGeneratedPack, viewingActivity, setViewingActivity,
    loginUser, logoutUser, addChild, setActiveChild, setMaterialInventory,
    logActivity, updateChildBadges, authMode, setAuthMode,
    addCredits, consumeCredit, hasCreditForToday,
    lastPackGeneratedOn: p.lastPackGeneratedOn,
    saveKYCData,
    saveOutcomeChecklist,
    toggleMilestoneCheck,
    generatorIntent,
    setGeneratorIntent,
    clearGeneratorIntent: () => setGeneratorIntent(null),
    exportLocalDataBackup,
    importLocalDataBackup,
    setLocale,
    saveSensoryProfile,
    saveAdaptiveModel,
    addSiblingGroup,
    addCollaborationLog,
    addPortfolioEntry,
    removePortfolioEntry,
    addReportHistoryEntry,
    setCommunityRatingCache,
    saveRoutineConfig,
    setQuests,
    setEnhancedStreak,
    saveNotificationPrefs,
    saveUsagePattern,
    addCaregiver,
    removeCaregiver,
    saveNarrativeCache,
  };
  return <AppCtx.Provider value={value}>{ch}</AppCtx.Provider>;
}
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import type { Session } from "@supabase/supabase-js";
import { Activity, getAgeTierFromDob } from "../data/activities";
import { currentMonthKey, computeComposite, type OutcomeChecklistMonth } from "../data/outcomeChecklist";
import { getSupabaseBrowserClient, signOutSupabase } from "../../utils/supabase/client";
import { captureProductEvent } from "../../utils/productAnalytics";
import { buildNeurosparkBackupFile, parseNeurosparkBackupFile } from "../../utils/neurosparkBackup";
import { clearPersistedRemoteSession, consumeCreditBalance, getViewAfterSessionSync, syncPersistedSessionUser } from "../logic/sessionSync";
import { canAccessBlueprint } from "../../utils/adminAccess";
export type { OutcomeChecklistMonth } from "../data/outcomeChecklist";

// ─── Types ─────────────────────────────────────────────────────────────────────
export type AppView =
  | "landing" | "auth"
  | "onboard_welcome" | "onboard_child" | "onboard_materials" | "onboard_ready"
  | "home" | "generate" | "pack_result" | "activity_detail"
  | "history" | "stats" | "profile" | "add_child" | "blueprint"
  | "paywall" | "year_plan" | "ai_counselor"
  | "brain_map" | "know_your_child" | "milestones"
  | "legal_info";

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
}

export interface GeneratorIntent {
  source: "milestone_concern";
  title: string;
  note: string;
  suggestedMood?: string;
  priorityIntelligences: string[];
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

  useEffect(() => { save(p); }, [p]);

  // Supabase: session lifecycle (refresh is automatic via client config), remote sign-out, metadata updates
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;

    const syncFromSession = (session: Session | null) => {
      setP((prev) => {
        const next = syncPersistedSessionUser(prev, session);
        setView((v) => getViewAfterSessionSync(v, { hasChildren: next.children.length > 0 }));
        return next;
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
    setP((prev) => {
      if (prev.children.length === 0) setView("onboard_welcome");
      else setView("home");
      return { ...prev, user };
    });
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
    const newChildren = p.children.map(c => {
      if (c.id !== log.childId) return c;
      const newBP = c.brainPoints + bp;
      const newLevel = getLevelFromBP(newBP).level;
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const isConsec = c.lastStreakDate === yesterday.toDateString();
      const isSameDay = c.lastStreakDate === today;
      const newStreak = isSameDay ? c.streak : isConsec ? c.streak + 1 : 1;
      const newIntel = { ...c.intelligenceScores };
      log.intelligences.forEach(i => { newIntel[i] = (newIntel[i] ?? 0) + 1; });
      const newBadges = [...c.badges];
      const addBadge = (b: string) => { if (!newBadges.includes(b)) newBadges.push(b); };
      if (!newBadges.includes("first_activity")) addBadge("first_activity");
      if (newStreak >= 7) addBadge("week_streak");
      if ((c.totalActivities + 1) >= 10) addBadge("ten_activities");
      return { ...c, brainPoints: newBP, level: newLevel, streak: newStreak, lastStreakDate: today, badges: newBadges, totalActivities: c.totalActivities + (log.completed ? 1 : 0), intelligenceScores: newIntel };
    });
    upd({ activityLogs: [entry, ...p.activityLogs], children: newChildren });
    if (log.completed) {
      captureProductEvent("activity_complete", {
        primary_intel: log.intelligences[0],
        duration_min: log.duration,
        region: log.region,
      });
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
  };
  return <AppCtx.Provider value={value}>{ch}</AppCtx.Provider>;
}
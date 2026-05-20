/** Pure gamification helpers for admin Mission HQ (duplicated under supabase/functions/server for Edge). */

export type MissionTier = "intro" | "standard" | "major" | "epic";

export interface MissionDef {
  key: string;
  trackId: string;
  trackLabel: string;
  title: string;
  description: string;
  xp: number;
  tier: MissionTier;
  docPath?: string;
  sortOrder: number;
}

export interface MissionCompletion {
  mission_key: string;
  completed_at: string;
  xp_awarded: number;
}

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
}

const XP_PER_LEVEL = 400;

export function levelFromTotalXp(totalXp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
  const clamped = Math.max(0, Math.floor(totalXp));
  const level = 1 + Math.floor(clamped / XP_PER_LEVEL);
  const xpIntoLevel = clamped % XP_PER_LEVEL;
  return { level, xpIntoLevel, xpForNextLevel: XP_PER_LEVEL };
}

/** UTC calendar dates yyyy-mm-dd, newest first, unique. */
export function streakFromCompletionTimestamps(isoTimestamps: string[], now = new Date()): number {
  const todayUtc = now.toISOString().slice(0, 10);
  const days = new Set<string>();
  for (const ts of isoTimestamps) {
    if (typeof ts === "string" && ts.length >= 10) days.add(ts.slice(0, 10));
  }
  if (days.size === 0) return 0;

  const d = new Date(`${todayUtc}T12:00:00.000Z`);
  // If no activity today, start streak from yesterday (forgiving)
  if (!days.has(todayUtc)) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak++;
      d.setUTCDate(d.getUTCDate() - 1);
    } else break;
  }
  return streak;
}

export function evaluateBadges(
  completedKeys: Set<string>,
  byTrackCounts: Record<string, number>,
  byTrackTotals: Record<string, number>,
  streak: number,
  totalXp: number,
  missionCount: number,
): BadgeDef[] {
  const pct = (tid: string) => {
    const t = byTrackTotals[tid] ?? 0;
    const c = byTrackCounts[tid] ?? 0;
    return t === 0 ? 0 : c / t;
  };

  const checks: Array<Omit<BadgeDef, "unlocked"> & { unlocked: boolean }> = [
    {
      id: "first_step",
      title: "First step",
      description: "Complete any mission.",
      emoji: "👣",
      unlocked: completedKeys.size >= 1,
    },
    {
      id: "momentum",
      title: "Momentum",
      description: "Complete 5 missions.",
      emoji: "⚡",
      unlocked: completedKeys.size >= 5,
    },
    {
      id: "closer",
      title: "Closer",
      description: "Complete 15 missions.",
      emoji: "🎯",
      unlocked: completedKeys.size >= 15,
    },
    {
      id: "finisher",
      title: "Finisher",
      description: "Complete every mission in the HQ.",
      emoji: "🏁",
      unlocked: missionCount > 0 && completedKeys.size >= missionCount,
    },
    {
      id: "daily_driver",
      title: "Daily driver",
      description: "Maintain a 3-day completion streak.",
      emoji: "🔥",
      unlocked: streak >= 3,
    },
    {
      id: "week_warrior",
      title: "Week warrior",
      description: "Maintain a 7-day completion streak.",
      emoji: "🌋",
      unlocked: streak >= 7,
    },
    {
      id: "launch_legend",
      title: "Launch legend",
      description: "Clear 100% of the Launch & production track.",
      emoji: "🚀",
      unlocked: pct("launch_prod") >= 1,
    },
    {
      id: "growth_gladiator",
      title: "Growth gladiator",
      description: "Clear 100% of the Growth Command Center track.",
      emoji: "📊",
      unlocked: pct("gcc") >= 1,
    },
    {
      id: "distribution_dynamo",
      title: "Distribution dynamo",
      description: "Clear 100% of the Distribution track.",
      emoji: "📣",
      unlocked: pct("distribution") >= 1,
    },
    {
      id: "revenue_ranger",
      title: "Revenue ranger",
      description: "Clear 100% of Partnerships & revenue.",
      emoji: "💰",
      unlocked: pct("partnerships") >= 1,
    },
    {
      id: "trust_guardian",
      title: "Trust guardian",
      description: "Clear 100% of Compliance & trust.",
      emoji: "🛡️",
      unlocked: pct("compliance") >= 1,
    },
    {
      id: "scale_seeker",
      title: "Scale seeker",
      description: "Clear 100% of Global scale milestones.",
      emoji: "🌍",
      unlocked: pct("global_scale") >= 1,
    },
    {
      id: "xp_hundred",
      title: "Century club",
      description: "Earn 100 XP.",
      emoji: "💯",
      unlocked: totalXp >= 100,
    },
    {
      id: "xp_five_hundred",
      title: "High voltage",
      description: "Earn 500 XP.",
      emoji: "⚙️",
      unlocked: totalXp >= 500,
    },
    {
      id: "xp_twok",
      title: "Operators elite",
      description: "Earn 2000 XP.",
      emoji: "🎖️",
      unlocked: totalXp >= 2000,
    },
  ];

  return checks.map(({ unlocked, ...b }) => ({ ...b, unlocked }));
}

export function summarizeMissions(missions: MissionDef[], completions: MissionCompletion[]) {
  const byKey = new Map(completions.map((c) => [c.mission_key, c]));
  const completedKeys = new Set(completions.map((c) => c.mission_key));
  const timestamps = completions.map((c) => c.completed_at);

  const byTrackTotals: Record<string, number> = {};
  const byTrackCounts: Record<string, number> = {};
  for (const m of missions) {
    byTrackTotals[m.trackId] = (byTrackTotals[m.trackId] ?? 0) + 1;
    if (completedKeys.has(m.key)) byTrackCounts[m.trackId] = (byTrackCounts[m.trackId] ?? 0) + 1;
  }

  const totalXp = completions.reduce((s, c) => s + (Number(c.xp_awarded) || 0), 0);
  const streak = streakFromCompletionTimestamps(timestamps);
  const { level, xpIntoLevel, xpForNextLevel } = levelFromTotalXp(totalXp);
  const badges = evaluateBadges(
    completedKeys,
    byTrackCounts,
    byTrackTotals,
    streak,
    totalXp,
    missions.length,
  );

  const merged = missions.map((m) => {
    const row = byKey.get(m.key);
    return {
      ...m,
      completed: !!row,
      completed_at: row?.completed_at ?? null,
      xp_awarded: row?.xp_awarded ?? null,
    };
  });

  return {
    merged,
    stats: {
      totalXp,
      level,
      xpIntoLevel,
      xpForNextLevel,
      streak,
      completedCount: completedKeys.size,
      totalMissions: missions.length,
      percent: missions.length ? Math.round((completedKeys.size / missions.length) * 1000) / 10 : 0,
      badges,
      byTrack: missions.reduce<
        Record<string, { label: string; done: number; total: number }>
      >((acc, m) => {
        if (!acc[m.trackId]) acc[m.trackId] = { label: m.trackLabel, done: 0, total: 0 };
        acc[m.trackId].total++;
        if (completedKeys.has(m.key)) acc[m.trackId].done++;
        return acc;
      }, {}),
    },
  };
}

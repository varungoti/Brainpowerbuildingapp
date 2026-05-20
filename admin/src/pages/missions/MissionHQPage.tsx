import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Filter,
  Flame,
  Loader2,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { api } from "../../lib/api.ts";

type Tier = "intro" | "standard" | "major" | "epic";

interface MissionRow {
  key: string;
  trackId: string;
  trackLabel: string;
  title: string;
  description: string;
  xp: number;
  tier: Tier;
  docPath?: string;
  sortOrder: number;
  completed: boolean;
  completed_at: string | null;
  xp_awarded: number | null;
}

interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
}

interface MissionsPayload {
  missions: MissionRow[];
  stats: {
    totalXp: number;
    level: number;
    xpIntoLevel: number;
    xpForNextLevel: number;
    streak: number;
    completedCount: number;
    totalMissions: number;
    percent: number;
    badges: Badge[];
    byTrack: Record<string, { label: string; done: number; total: number }>;
  };
}

const TIER_STYLES: Record<Tier, string> = {
  intro: "bg-slate-100 text-slate-700 border-slate-200",
  standard: "bg-violet-100 text-violet-800 border-violet-200",
  major: "bg-amber-100 text-amber-900 border-amber-200",
  epic: "bg-rose-100 text-rose-900 border-rose-200",
};

export const MissionHQPage: React.FC = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "open" | string>("all");
  const [openTracks, setOpenTracks] = useState<Record<string, boolean>>({});

  const q = useQuery({
    queryKey: ["admin-missions"],
    queryFn: () => api<MissionsPayload>("/admin/missions"),
  });

  const complete = useMutation({
    mutationFn: (key: string) =>
      api<{ ok: boolean; xp_awarded: number }>(`/admin/missions/${encodeURIComponent(key)}/complete`, {
        method: "POST",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-missions"] });
      void qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });

  const uncomplete = useMutation({
    mutationFn: (key: string) =>
      api<{ ok: boolean }>(`/admin/missions/${encodeURIComponent(key)}/complete`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-missions"] });
      void qc.invalidateQueries({ queryKey: ["audit"] });
    },
  });

  const grouped = useMemo(() => {
    const rows = q.data?.missions ?? [];
    const map = new Map<string, MissionRow[]>();
    for (const m of rows) {
      if (!map.has(m.trackId)) map.set(m.trackId, []);
      map.get(m.trackId)!.push(m);
    }
    for (const [, list] of map) list.sort((a, b) => a.sortOrder - b.sortOrder);
    return map;
  }, [q.data?.missions]);

  const trackOrder = useMemo(() => {
    const first = q.data?.missions ?? [];
    const seen: string[] = [];
    const labels: Record<string, string> = {};
    for (const m of first) {
      if (!seen.includes(m.trackId)) {
        seen.push(m.trackId);
        labels[m.trackId] = m.trackLabel;
      }
    }
    return { order: seen, labels };
  }, [q.data?.missions]);

  const stats = q.data?.stats;

  if (q.isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-600 py-20 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading Mission HQ…
      </div>
    );
  }
  if (q.isError || !stats) {
    return <div className="card text-red-600">Could not load Mission HQ. Check admin role and Edge deployment.</div>;
  }

  const xpPct = Math.min(100, Math.round((stats.xpIntoLevel / stats.xpForNextLevel) * 100));
  const unlockedBadges = stats.badges.filter((b) => b.unlocked).length;

  function filteredRows(list: MissionRow[]): MissionRow[] {
    if (filter === "all") return list;
    if (filter === "open") return list.filter((m) => !m.completed);
    return list.filter((m) => m.trackId === filter);
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-600 mb-1">
            <Trophy className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-widest">Mission HQ</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold">Ops quests and launch momentum</h1>
          <p className="text-slate-600 mt-2 max-w-2xl text-sm">
            Check off real operational work—XP, levels, streaks, and badges update per admin user. Completing missions also writes to the{" "}
            <a className="text-primary hover:underline" href="#audit">
              audit log
            </a>
            . For live OKRs, gates, and automation state, use{" "}
            <a className="text-primary hover:underline" href="#growth">
              $10M Growth
            </a>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white px-5 py-3 shadow-lg shrink-0">
          <Sparkles className="w-8 h-8 opacity-90" />
          <div>
            <div className="text-xs font-semibold uppercase opacity-90">Operator level</div>
            <div className="text-2xl font-display font-extrabold leading-none">{stats.level}</div>
          </div>
        </div>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card border-2 border-violet-200 bg-gradient-to-b from-white to-violet-50/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-slate-500">Experience</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-display font-extrabold text-violet-700">{stats.totalXp} XP</div>
          <div className="mt-3 h-2 rounded-full bg-violet-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {stats.xpIntoLevel} / {stats.xpForNextLevel} XP to level {stats.level + 1}
          </p>
        </div>

        <div className="card border-2 border-orange-200 bg-gradient-to-b from-white to-orange-50/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-slate-500">Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-3xl font-display font-extrabold text-orange-700">{stats.streak} days</div>
          <p className="text-sm text-slate-600 mt-2">
            Complete at least one mission on consecutive UTC days. Miss a day—streak snaps (we start from today or yesterday if you
            were active).
          </p>
        </div>

        <div className="card border-2 border-emerald-200 bg-gradient-to-b from-white to-emerald-50/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-slate-500">Progress</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-display font-extrabold text-emerald-700">{stats.percent}%</div>
          <p className="text-sm text-slate-600 mt-2">
            {stats.completedCount} / {stats.totalMissions} missions cleared
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(stats.byTrack).map(([tid, t]) => (
              <span
                key={tid}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800"
                title={t.label}
              >
                {t.done}/{t.total}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Badges */}
      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Badges
            <span className="text-sm font-normal text-slate-500">
              {unlockedBadges}/{stats.badges.length} unlocked
            </span>
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl border p-3 text-center transition ${
                b.unlocked ? "border-amber-300 bg-amber-50 shadow-sm scale-100" : "border-slate-200 bg-slate-50 opacity-45 grayscale"
              }`}
            >
              <div className="text-2xl mb-1">{b.emoji}</div>
              <div className="text-xs font-bold">{b.title}</div>
              <p className="text-[10px] text-slate-600 mt-1 leading-snug">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase text-slate-500 inline-flex items-center gap-1">
          <Filter className="w-3 h-3" /> View
        </span>
        {(["all", "open"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
              filter === f ? "bg-primary text-white border-primary" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {f === "all" ? "All missions" : "Open only"}
          </button>
        ))}
        <select
          className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
          value={filter !== "all" && filter !== "open" ? filter : ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v) setFilter(v);
            else setFilter("all");
          }}
        >
          <option value="">All tracks…</option>
          {trackOrder.order.map((tid) => (
            <option key={tid} value={tid}>
              {trackOrder.labels[tid]}
            </option>
          ))}
        </select>
      </div>

      {/* Tracks */}
      <div className="space-y-3">
        {trackOrder.order.map((trackId) => {
          const rows = grouped.get(trackId) ?? [];
          const visible = filteredRows(rows);
          if (visible.length === 0) return null;
          const expanded = openTracks[trackId] ?? true;
          const label = trackOrder.labels[trackId] ?? trackId;
          const done = rows.filter((m) => m.completed).length;

          return (
            <div key={trackId} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left"
                onClick={() => setOpenTracks((s) => ({ ...s, [trackId]: !expanded }))}
              >
                <span className="font-bold text-slate-800 flex items-center gap-2">
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {label}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {done}/{rows.length} done
                </span>
              </button>
              {expanded && (
                <ul className="divide-y divide-slate-100">
                  {visible.map((m) => (
                    <li
                      key={m.key}
                      className={`px-4 py-4 flex gap-4 transition-colors ${m.completed ? "bg-emerald-50/40" : "hover:bg-slate-50/80"}`}
                    >
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                          checked={m.completed}
                          disabled={complete.isPending || uncomplete.isPending}
                          onChange={(e) => {
                            if (e.target.checked) complete.mutate(m.key);
                            else uncomplete.mutate(m.key);
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">{m.title}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${TIER_STYLES[m.tier]}`}>
                            +{m.xp} XP · {m.tier}
                          </span>
                          {m.completed && m.completed_at && (
                            <span className="text-[10px] text-emerald-700 font-medium">
                              Done {new Date(m.completed_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{m.description}</p>
                        {m.docPath && (
                          <p className="text-xs mt-2">
                            <span className="inline-flex items-center gap-1 text-primary">
                              <BookOpen className="w-3 h-3" />
                              <code className="bg-slate-100 px-1 rounded text-[11px]">{m.docPath}</code>
                            </span>
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {(complete.isError || uncomplete.isError) && (
        <p className="text-sm text-red-600">Update failed—check network or permissions (marketing role required to toggle).</p>
      )}
    </div>
  );
};

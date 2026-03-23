import React, { useState, useMemo } from "react";
import { useApp, BADGE_DEFS } from "../context/AppContext";
import { INTEL_COLORS } from "../data/activities";

// ─── Streak Calendar (last 30 days) ──────────────────────────────────────────
function StreakCalendar({ childId, activityLogs }: {
  childId: string;
  activityLogs: Array<{ childId: string; date: string; completed: boolean }>;
}) {
  const days = useMemo(() => {
    const result: { date: Date; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const count = activityLogs.filter(
        (l) => l.childId === childId && l.completed && new Date(l.date).toDateString() === ds
      ).length;
      result.push({ date: d, count });
    }
    return result;
  }, [childId, activityLogs]);

  const maxCount = Math.max(...days.map((d) => d.count), 1);

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold text-gray-800 text-sm">30-Day Activity Heatmap</div>
        <div className="text-gray-400 text-xs">Last 30 days</div>
      </div>
      <div className="flex gap-0.5 flex-wrap">
        {days.map(({ date, count }, i) => {
          const intensity = count === 0 ? 0 : Math.ceil((count / maxCount) * 4);
          const bg =
            intensity === 0 ? "#F3F4F6" :
            intensity === 1 ? "#BBF7D0" :
            intensity === 2 ? "#4ADE80" :
            intensity === 3 ? "#16A34A" :
            "#064E3B";
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div
              key={i}
              title={`${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: ${count} activities`}
              className="rounded-sm transition-all"
              style={{
                width: "calc((100% - 29 * 2px) / 30)",
                paddingBottom: "calc((100% - 29 * 2px) / 30)",
                background: bg,
                border: isToday ? "1px solid #4361EE" : "none",
                position: "relative",
              }}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-2 justify-end">
        <span className="text-gray-400" style={{ fontSize: 9 }}>Less</span>
        {["#F3F4F6", "#BBF7D0", "#4ADE80", "#16A34A", "#064E3B"].map((c) => (
          <div key={c} className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
        ))}
        <span className="text-gray-400" style={{ fontSize: 9 }}>More</span>
      </div>
    </div>
  );
}

// ─── Weekly Bar Chart ─────────────────────────────────────────────────────────
function WeekChart({ childId, activityLogs }: {
  childId: string;
  activityLogs: Array<{ childId: string; date: string; completed: boolean; brainPointsEarned: number }>;
}) {
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      const ds = d.toDateString();
      const logs = activityLogs.filter(
        (l) => l.childId === childId && l.completed && new Date(l.date).toDateString() === ds
      );
      return { label: d.toLocaleDateString("en-GB", { weekday: "short" }).slice(0, 2), count: logs.length, bp: logs.reduce((s, l) => s + l.brainPointsEarned, 0), isToday: i === 6 };
    });
  }, [childId, activityLogs]);

  const maxCount = Math.max(...weekDays.map((d) => d.count), 1);

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <div className="font-bold text-gray-800 text-sm mb-3">This Week</div>
      <div className="flex items-end gap-1.5 h-20">
        {weekDays.map(({ label, count, bp, isToday }, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-gray-400 font-mono" style={{ fontSize: 8 }}>
              {count > 0 && <span style={{ color: "#4361EE" }}>{count}</span>}
            </div>
            <div
              className="w-full rounded-t-lg transition-all"
              style={{
                height: count === 0 ? 4 : Math.max(8, (count / maxCount) * 56),
                background: isToday
                  ? "linear-gradient(180deg,#F72585,#7209B7)"
                  : count > 0 ? "linear-gradient(180deg,#4361EE,#7209B780)" : "#F3F4F6",
              }}
            />
            <div className="text-gray-500 font-semibold" style={{ fontSize: 9 }}>{label}</div>
          </div>
        ))}
      </div>
      <div className="text-gray-400 text-xs mt-1 text-right">
        {weekDays.reduce((s, d) => s + d.bp, 0)} BP earned this week
      </div>
    </div>
  );
}

// ─── Badges Display ───────────────────────────────────────────────────────────
function BadgesPanel({ badges }: { badges: string[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <div className="font-bold text-gray-800 text-sm mb-3">Badges Earned 🏅</div>
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => {
          const def = BADGE_DEFS[b];
          if (!def) return null;
          return (
            <div key={b} className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ background: "#FFFBEF", border: "1.5px solid #FFB70340" }}>
              <span style={{ fontSize: 16 }}>{def.emoji}</span>
              <div>
                <div className="text-gray-800 font-semibold" style={{ fontSize: 10 }}>{def.label}</div>
                <div className="text-gray-400" style={{ fontSize: 9 }}>{def.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function HistoryScreen() {
  const { activityLogs, activeChild, children, setActiveChild } = useApp();
  const [filter, setFilter] = useState<"all" | "completed" | "skipped">("all");
  const [childFilter, setChildFilter] = useState(activeChild?.id ?? "all");
  const [showCalendar, setShowCalendar] = useState(true);

  const focusChild = children.find((c) => c.id === childFilter) ?? activeChild;

  const logs = activityLogs
    .filter((l) => childFilter === "all" ? true : l.childId === childFilter)
    .filter((l) => filter === "all" ? true : filter === "completed" ? l.completed : !l.completed);

  const totalBP = logs.reduce((s, l) => s + l.brainPointsEarned, 0);
  const completed = logs.filter((l) => l.completed).length;
  const streak = focusChild?.streak ?? 0;

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F0EFFF" }}>
      {/* Header */}
      <div
        className="rounded-b-3xl mb-4 px-4 pt-3 pb-5"
        style={{ background: "linear-gradient(135deg,#06D6A0,#4361EE)" }}
      >
        <div className="text-white/70 text-xs mb-0.5">Activity History</div>
        <div className="text-white font-black text-xl mb-3">Brain Journey</div>
        <div className="flex gap-2.5">
          <StatPill label="Total" val={`${logs.length}`} />
          <StatPill label="Completed" val={`${completed}`} />
          <StatPill label="Brain Points" val={totalBP.toLocaleString()} />
          <StatPill label="🔥 Streak" val={`${streak}d`} />
        </div>
      </div>

      <div className="px-4 pb-6 space-y-3">
        {/* Child filter */}
        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterBtn active={childFilter === "all"} onClick={() => setChildFilter("all")} label="All Children" />
            {children.map((c) => (
              <FilterBtn
                key={c.id}
                active={childFilter === c.id}
                onClick={() => { setChildFilter(c.id); setActiveChild(c.id); }}
                label={`${c.avatarEmoji} ${c.name}`}
              />
            ))}
          </div>
        )}

        {/* Charts toggle */}
        <button
          onClick={() => setShowCalendar((s) => !s)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white shadow-sm border border-gray-100"
        >
          <span className="text-gray-700 font-semibold text-sm">📊 Progress Charts</span>
          <span className="text-gray-400 text-xs">{showCalendar ? "Hide ▲" : "Show ▼"}</span>
        </button>

        {showCalendar && childFilter !== "all" && (
          <>
            <WeekChart childId={childFilter} activityLogs={activityLogs} />
            <StreakCalendar childId={childFilter} activityLogs={activityLogs} />
          </>
        )}
        {showCalendar && focusChild && childFilter !== "all" && (
          <BadgesPanel badges={focusChild.badges} />
        )}

        {/* Status filter */}
        <div className="flex gap-2">
          {(["all", "completed", "skipped"] as const).map((f) => (
            <FilterBtn key={f} active={filter === f} onClick={() => setFilter(f)}
              label={f.charAt(0).toUpperCase() + f.slice(1)} />
          ))}
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4 animate-float">📋</div>
            <div className="text-gray-600 font-semibold mb-2">No activities yet</div>
            <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
              Complete activities from the Today tab to see your brain journey grow here.
              {"\n"}Your 30-day heatmap and streaks will update after your first session.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => {
              const child = children.find((c) => c.id === log.childId);
              const dateStr = new Date(log.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
              const timeStr = new Date(log.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
              return (
                <div
                  key={log.id}
                  className={`bg-white rounded-2xl p-3.5 border animate-slide-up stagger-${Math.min(i % 6 + 1, 6)}`}
                  style={{ borderColor: log.completed ? "rgba(6,214,160,0.3)" : "#e5e7eb" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: log.completed ? "rgba(6,214,160,0.12)" : "#F5F5F5" }}
                    >
                      {log.completed ? log.emoji : "⏭️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-gray-800 text-sm truncate">{log.activityName}</span>
                        {log.completed && (
                          <span
                            className="text-xs font-bold flex-shrink-0 animate-pulse-gold rounded-full px-2 py-0.5"
                            style={{ background: "#FFFBEF", color: "#FFB703" }}
                          >
                            +{log.brainPointsEarned} BP
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-gray-400" style={{ fontSize: 10 }}>
                          {log.regionEmoji} {log.region} · {log.duration}m
                        </span>
                        {child && (
                          <span className="text-gray-400" style={{ fontSize: 10 }}>
                            {child.avatarEmoji} {child.name}
                          </span>
                        )}
                        <span className="text-gray-400" style={{ fontSize: 10 }}>
                          {dateStr} {timeStr}
                        </span>
                      </div>
                      {log.engagementRating > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} style={{ fontSize: 11, opacity: log.engagementRating >= s ? 1 : 0.25 }}>
                              ⭐
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {log.intelligences.slice(0, 2).map((intel) => (
                          <span
                            key={intel}
                            className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{
                              background: (INTEL_COLORS[intel] ?? "#888") + "18",
                              color: INTEL_COLORS[intel] ?? "#888",
                            }}
                          >
                            {intel.split("-")[0]}
                          </span>
                        ))}
                      </div>
                      {log.parentNotes && (
                        <p className="text-gray-500 text-xs mt-1 italic">"{log.parentNotes}"</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, val }: { label: string; val: string }) {
  return (
    <div className="glass rounded-xl px-3 py-2 text-center flex-1">
      <div className="text-white font-black" style={{ fontSize: 15 }}>{val}</div>
      <div className="text-white/60" style={{ fontSize: 9 }}>{label}</div>
    </div>
  );
}

function FilterBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
      style={{
        background: active ? "linear-gradient(135deg,#4361EE,#7209B7)" : "white",
        color: active ? "white" : "#6B7280",
        border: `1.5px solid ${active ? "transparent" : "#e5e7eb"}`,
      }}
    >
      {label}
    </button>
  );
}

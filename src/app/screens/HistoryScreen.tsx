import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { INTEL_COLORS } from "../data/activities";

export function HistoryScreen() {
  const { activityLogs, activeChild, children, setActiveChild } = useApp();
  const [filter, setFilter] = useState<"all"|"completed"|"skipped">("all");
  const [childFilter, setChildFilter] = useState(activeChild?.id ?? "all");

  const logs = activityLogs
    .filter(l => childFilter === "all" ? true : l.childId === childFilter)
    .filter(l => filter === "all" ? true : filter === "completed" ? l.completed : !l.completed);

  const totalBP = logs.reduce((s, l) => s + l.brainPointsEarned, 0);
  const completed = logs.filter(l => l.completed).length;

  return (
    <div className="h-full overflow-y-auto" style={{ background:"#F0EFFF" }}>
      {/* Header */}
      <div className="rounded-b-3xl mb-4 px-4 pt-3 pb-4"
        style={{ background:"linear-gradient(135deg,#06D6A0,#4361EE)" }}>
        <div className="text-white/70 text-xs mb-1">Activity History</div>
        <div className="text-white font-black text-xl mb-2">Brain Journey</div>
        <div className="flex gap-3 text-center">
          <StatPill label="Total" val={`${logs.length}`} />
          <StatPill label="Completed" val={`${completed}`} />
          <StatPill label="Brain Points" val={`${totalBP}`} />
        </div>
      </div>

      <div className="px-4 pb-6 space-y-3">
        {/* Child filter */}
        {children.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterBtn active={childFilter==="all"} onClick={() => setChildFilter("all")} label="All Children" />
            {children.map(c => (
              <FilterBtn key={c.id} active={childFilter===c.id} onClick={() => { setChildFilter(c.id); setActiveChild(c.id); }}
                label={`${c.avatarEmoji} ${c.name}`} />
            ))}
          </div>
        )}

        {/* Status filter */}
        <div className="flex gap-2">
          {(["all","completed","skipped"] as const).map(f => (
            <FilterBtn key={f} active={filter===f} onClick={() => setFilter(f)}
              label={f.charAt(0).toUpperCase()+f.slice(1)} />
          ))}
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4 animate-float">📋</div>
            <div className="text-gray-600 font-semibold mb-2">No activities yet</div>
            <p className="text-gray-400 text-xs">Complete activities from the Generate tab to see your history here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => {
              const child = children.find(c => c.id === log.childId);
              const dateStr = new Date(log.date).toLocaleDateString("en-GB",{ day:"numeric",month:"short" });
              const timeStr = new Date(log.date).toLocaleTimeString("en-GB",{ hour:"2-digit",minute:"2-digit" });
              return (
                <div key={log.id} className={`bg-white rounded-2xl p-3.5 border animate-slide-up stagger-${Math.min(i%6+1,6)}`}
                  style={{ borderColor:log.completed?"rgba(6,214,160,0.3)":"#e5e7eb" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background:log.completed?"rgba(6,214,160,0.12)":"#F5F5F5" }}>
                      {log.completed ? log.emoji : "⏭️"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-gray-800 text-sm truncate">{log.activityName}</span>
                        {log.completed && (
                          <span className="text-xs font-bold flex-shrink-0 animate-pulse-gold rounded-full px-2 py-0.5"
                            style={{ background:"#FFFBEF", color:"#FFB703" }}>+{log.brainPointsEarned} BP</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-gray-400" style={{ fontSize:10 }}>{log.regionEmoji} {log.region} · {log.duration}m</span>
                        {child && <span className="text-gray-400" style={{ fontSize:10 }}>{child.avatarEmoji} {child.name}</span>}
                        <span className="text-gray-400" style={{ fontSize:10 }}>{dateStr} {timeStr}</span>
                      </div>
                      {log.engagementRating > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} style={{ fontSize:11, opacity:log.engagementRating>=s?1:0.25 }}>⭐</span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {log.intelligences.slice(0,2).map(intel => (
                          <span key={intel} className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background:(INTEL_COLORS[intel]??"#888")+"18", color:INTEL_COLORS[intel]??"#888" }}>
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

function StatPill({ label, val }: { label:string; val:string }) {
  return (
    <div className="glass rounded-xl px-3 py-2 text-center">
      <div className="text-white font-black" style={{ fontSize:16 }}>{val}</div>
      <div className="text-white/60" style={{ fontSize:9 }}>{label}</div>
    </div>
  );
}

function FilterBtn({ active, onClick, label }: { active:boolean; onClick:()=>void; label:string }) {
  return (
    <button onClick={onClick} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
      style={{ background:active?"linear-gradient(135deg,#4361EE,#7209B7)":"white",
        color:active?"white":"#6B7280", border:`1.5px solid ${active?"transparent":"#e5e7eb"}` }}>
      {label}
    </button>
  );
}

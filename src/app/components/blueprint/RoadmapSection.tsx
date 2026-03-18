import { useState } from "react";
import { ROADMAP_PHASES } from "./data";

export function RoadmapSection() {
  const [activePhase, setActivePhase] = useState<number>(0);
  const phase = ROADMAP_PHASES[activePhase];

  return (
    <div>
      <MobileHeader emoji="🗺️" title="12-Month Roadmap" sub="5 phases · from research to launch" />

      {/* Phase Scroller */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        {ROADMAP_PHASES.map((p, i) => (
          <button
            key={p.phase}
            onClick={() => setActivePhase(i)}
            className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-2xl border-2 transition-all"
            style={{
              background: activePhase === i ? p.color : p.bg,
              borderColor: activePhase === i ? p.color : `${p.color}40`,
              color: activePhase === i ? "white" : "#555",
              minWidth: 80,
            }}
          >
            <span className="text-lg">{p.emoji}</span>
            <span className="text-xs font-bold">Phase {p.phase}</span>
            <span className="text-xs opacity-75 text-center leading-tight">{p.duration.replace("Months ", "Mths ")}</span>
            {p.status === "current" && (
              <span className="text-xs bg-white/30 rounded-full px-1.5 mt-0.5" style={{ color: activePhase === i ? "white" : p.color }}>
                NOW
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Phase Detail */}
      <div className="rounded-2xl border-2 overflow-hidden mb-4" style={{ borderColor: phase.color }}>
        <div className="p-4" style={{ background: phase.bg }}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-white px-2.5 py-1 rounded-full" style={{ background: phase.color }}>
              Phase {phase.phase}
            </span>
            <span className="text-xs text-gray-500">{phase.duration}</span>
            {phase.status === "current" && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">● Current</span>
            )}
          </div>
          <div className="text-sm font-bold text-gray-900">{phase.name}</div>
        </div>

        <div className="bg-white p-4 space-y-4">
          {/* Objectives */}
          <div>
            <div className="text-xs font-bold mb-2" style={{ color: phase.color }}>🎯 Objectives</div>
            <div className="space-y-1.5">
              {phase.objectives.map((obj) => (
                <div key={obj} className="flex items-start gap-2 text-xs text-gray-600">
                  <span style={{ color: phase.color }} className="flex-shrink-0">→</span>
                  {obj}
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables */}
          <div>
            <div className="text-xs font-bold mb-2" style={{ color: phase.color }}>📦 Deliverables</div>
            <div className="space-y-1.5">
              {phase.deliverables.map((del) => (
                <div key={del} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="flex-shrink-0">✓</span> {del}
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div>
            <div className="text-xs font-bold mb-2" style={{ color: phase.color }}>👥 Team</div>
            <div className="flex flex-wrap gap-1.5">
              {phase.team.map((member) => (
                <span key={member} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{member}</span>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div className="bg-red-50 rounded-xl p-3">
            <div className="text-xs font-bold text-red-600 mb-1.5">⚠️ Risks & Mitigations</div>
            {phase.risks.map((risk) => (
              <div key={risk} className="text-xs text-red-700 flex items-start gap-1 mb-1">
                <span className="flex-shrink-0 text-red-400">▸</span> {risk}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-bold text-gray-800">📅 12-Month Timeline</div>
        </div>
        <div className="overflow-x-auto p-3">
          <div style={{ minWidth: 480 }}>
            <div className="flex mb-2">
              <div className="w-28 flex-shrink-0" />
              <div className="flex flex-1 gap-0">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="flex-1 text-center text-xs text-gray-400">M{i + 1}</div>
                ))}
              </div>
            </div>
            {[
              { name: "Research",  color: "#4361EE", start: 0, end: 1 },
              { name: "Algorithm", color: "#7209B7", start: 1, end: 2 },
              { name: "Dev (MVP)", color: "#F72585", start: 2, end: 5 },
              { name: "Beta",      color: "#FB5607", start: 6, end: 7 },
              { name: "Launch",    color: "#2DC653", start: 8, end: 11 },
            ].map((row) => (
              <div key={row.name} className="flex items-center gap-0 mb-1.5">
                <div className="w-28 flex-shrink-0 text-xs text-gray-600 font-medium pr-2">{row.name}</div>
                <div className="flex flex-1 gap-0">
                  {Array.from({ length: 12 }, (_, m) => (
                    <div key={m} className="flex-1 h-5 mx-px rounded-sm"
                      style={{
                        background: m >= row.start && m <= row.end ? row.color : "#f3f4f6",
                        opacity: m >= row.start && m <= row.end ? 0.85 : 1,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Metrics */}
      <div className="bg-gray-900 rounded-2xl p-4">
        <div className="text-xs font-bold text-gray-400 mb-3 tracking-widest">🎯 YEAR 1 SUCCESS METRICS</div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { metric: "10,000", label: "Active Families", sub: "within 3 months" },
            { metric: "4.5★", label: "App Store Rating", sub: "target average" },
            { metric: "60%", label: "7-Day Retention", sub: "daily activity use" },
            { metric: "₹0/$0", label: "Cost to Families", sub: "forever free core" },
            { metric: "13", label: "Intelligence Types", sub: "fully tracked" },
            { metric: "16", label: "Methods Integrated", sub: "research-backed" },
          ].map((m) => (
            <div key={m.label} className="bg-gray-800 rounded-xl p-3">
              <div className="text-base font-bold text-white">{m.metric}</div>
              <div className="text-xs font-semibold text-gray-300 mt-0.5">{m.label}</div>
              <div className="text-xs text-gray-500">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileHeader({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-2xl">{emoji}</span>
        <h2 className="text-gray-900 font-bold" style={{ fontSize: "1.2rem" }}>{title}</h2>
      </div>
      <p className="text-gray-400 text-xs">{sub}</p>
    </div>
  );
}

import { useState } from "react";
import { AGE_TIERS } from "./data";

export function DevelopmentalMatrix() {
  const [activeTier, setActiveTier] = useState<number>(0);
  const tier = AGE_TIERS[activeTier];

  return (
    <div>
      <MobileHeader emoji="📊" title="Developmental Matrix" sub="5 age tiers · Piaget stages · brain dev." />

      {/* Tier Scroller */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        {AGE_TIERS.map((t, i) => (
          <button
            key={t.tier}
            onClick={() => setActiveTier(i)}
            className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-2xl border-2 transition-all"
            style={{
              background: activeTier === i ? t.color : "white",
              borderColor: activeTier === i ? t.color : "#e5e7eb",
              color: activeTier === i ? "white" : "#555",
              minWidth: 72,
            }}
          >
            <span className="text-lg">{t.emoji}</span>
            <span className="text-xs font-bold">{t.ages}</span>
            <span className="text-xs opacity-75">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tier Detail */}
      <div className="rounded-2xl border-2 overflow-hidden mb-4" style={{ borderColor: tier.color }}>
        {/* Header */}
        <div className="p-4" style={{ background: tier.bg }}>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold text-white px-2.5 py-1 rounded-full" style={{ background: tier.color }}>
              Tier {tier.tier}: {tier.ages}
            </span>
            <span className="text-xs font-semibold text-gray-600">"{tier.label}"</span>
          </div>
          <div className="text-xs text-gray-500 bg-white inline-block px-2 py-0.5 rounded-full mt-1">
            {tier.piagetStage}
          </div>
          <div className="flex gap-3 mt-2 text-xs text-gray-600">
            <span>⏱ {tier.activityDuration}</span>
            <span>📦 {tier.activityCount} activities/day</span>
          </div>
        </div>

        <div className="p-4 space-y-3 bg-white">
          {/* Brain Dev */}
          <div className="rounded-xl p-3 bg-gray-50">
            <div className="text-xs font-bold mb-1" style={{ color: tier.color }}>🔬 Brain Development</div>
            <p className="text-xs text-gray-600 leading-relaxed">{tier.brainDevelopment}</p>
          </div>

          {/* Milestones */}
          <div className="rounded-xl p-3 bg-gray-50">
            <div className="text-xs font-bold mb-2" style={{ color: tier.color }}>🏆 Key Milestones</div>
            <div className="space-y-1.5">
              {tier.keyMilestones.map((m) => (
                <div key={m} className="flex items-start gap-2 text-xs text-gray-600">
                  <span style={{ color: tier.color }} className="flex-shrink-0">✓</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Intelligences */}
          <div className="rounded-xl p-3 bg-gray-50">
            <div className="text-xs font-bold mb-2" style={{ color: tier.color }}>🎯 Priority Intelligences</div>
            <div className="flex flex-wrap gap-1.5">
              {tier.priorityIntelligences.map((intel) => (
                <span key={intel} className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.color}40` }}>
                  {intel}
                </span>
              ))}
            </div>
          </div>

          {/* Sample Activities */}
          <div>
            <div className="text-xs font-bold mb-2" style={{ color: tier.color }}>🎮 Sample Activities</div>
            <div className="space-y-2">
              {tier.sampleActivities.map((act) => (
                <div key={act.name} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                  <div className="text-sm font-semibold text-gray-800 mb-1.5">{act.name}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-xs text-gray-400">📚 {act.method}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: tier.bg, color: tier.color }}>{act.intelligence}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">🏠 {act.materials}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          <div className="rounded-xl p-3 bg-amber-50 border border-amber-100">
            <div className="text-xs font-bold text-amber-700 mb-2">⚠️ Design Notes</div>
            <div className="space-y-1">
              {tier.warnings.map((w) => (
                <div key={w} className="text-xs text-amber-800 flex items-start gap-1">
                  <span className="flex-shrink-0">▸</span> {w}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Ref Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-bold text-gray-800">All 5 Tiers Quick Reference</div>
        </div>
        <div className="divide-y divide-gray-100">
          {AGE_TIERS.map((t, i) => (
            <button
              key={t.tier}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              onClick={() => setActiveTier(i)}
            >
              <span className="text-lg">{t.emoji}</span>
              <div className="flex-1">
                <div className="text-xs font-bold" style={{ color: t.color }}>{t.ages} — {t.label}</div>
                <div className="text-xs text-gray-400">{t.activityDuration} · {t.activityCount}/day</div>
              </div>
              <div className="text-gray-300 text-sm">›</div>
            </button>
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

import { useState } from "react";
import { APP_FEATURES } from "./data";

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  "P0 — Launch Critical": { bg: "#FFF0F0", text: "#D4183D" },
  "P1 — Version 1.1":     { bg: "#EFF8FF", text: "#0077B6" },
  "P2 — Version 1.2":     { bg: "#F9F0FF", text: "#7209B7" },
};

export function FeaturesSection() {
  const [activeCategory, setActiveCategory] = useState<string>("Core Features");
  const [expanded, setExpanded] = useState<string | null>(null);

  const active = APP_FEATURES.find((f) => f.category === activeCategory)!;

  const countByPriority = (prefix: string) =>
    APP_FEATURES.flatMap((c) => c.features).filter((f) => f.priority.startsWith(prefix)).length;

  return (
    <div>
      <MobileHeader emoji="📱" title="App Feature Plan" sub="P0 / P1 / P2 · user stories · screens" />

      {/* Priority Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "P0 Critical", count: countByPriority("P0"), color: "#D4183D", bg: "#FFF0F0", sub: "Launch" },
          { label: "P1 v1.1",     count: countByPriority("P1"), color: "#0077B6", bg: "#EFF8FF", sub: "Update 1" },
          { label: "P2 v1.2",     count: countByPriority("P2"), color: "#7209B7", bg: "#F9F0FF", sub: "Update 2" },
        ].map((p) => (
          <div key={p.label} className="rounded-2xl border p-3 text-center" style={{ background: p.bg, borderColor: `${p.color}30` }}>
            <div className="text-2xl font-bold" style={{ color: p.color }}>{p.count}</div>
            <div className="text-xs font-semibold text-gray-700">{p.label}</div>
            <div className="text-xs text-gray-400">{p.sub}</div>
          </div>
        ))}
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        {APP_FEATURES.map((cat) => (
          <button
            key={cat.category}
            onClick={() => { setActiveCategory(cat.category); setExpanded(null); }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all"
            style={{
              background: activeCategory === cat.category ? cat.color : "white",
              color: activeCategory === cat.category ? "white" : "#555",
              borderColor: activeCategory === cat.category ? cat.color : "#e5e7eb",
              fontWeight: activeCategory === cat.category ? 600 : 400,
            }}
          >
            <span>{cat.emoji}</span>
            <span>{cat.category.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Feature Cards */}
      <div className="space-y-3 mb-4">
        {active.features.map((feature) => {
          const pc = PRIORITY_COLORS[feature.priority] ?? PRIORITY_COLORS["P2 — Version 1.2"];
          const isExp = expanded === feature.name;
          return (
            <div key={feature.name} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button className="w-full text-left p-4" onClick={() => setExpanded(isExp ? null : feature.name)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 inline-block"
                      style={{ background: pc.bg, color: pc.text }}>
                      {feature.priority}
                    </span>
                    <div className="text-sm font-bold text-gray-900">{feature.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{feature.description}</div>
                  </div>
                  <span className="text-gray-400 text-sm flex-shrink-0 mt-1">{isExp ? "▲" : "▼"}</span>
                </div>
              </button>
              {isExp && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                  <div className="pt-3">
                    <div className="text-xs font-bold text-gray-500 mb-1">👤 User Story</div>
                    <p className="text-xs text-gray-600 italic leading-relaxed"
                      style={{ borderLeft: `3px solid ${active.color}`, paddingLeft: 10 }}>
                      "{feature.userStory}"
                    </p>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1.5">📱 Screens</div>
                    <div className="flex flex-wrap gap-1.5">
                      {feature.screens.map((s) => (
                        <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-500 mb-1">🔧 Technical Notes</div>
                    <p className="text-xs text-gray-500 leading-relaxed">{feature.technicalNotes}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Flow */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <div className="text-xs font-bold text-gray-500 mb-3">📲 CORE NAVIGATION FLOW</div>
        <div className="flex flex-col gap-2">
          {[
            { screen: "Onboarding",      emoji: "👶", sub: "Age + Profile setup" },
            { screen: "Material Setup",  emoji: "🏠", sub: "Inventory checklist" },
            { screen: "Home / Daily",    emoji: "⭐", sub: "Generated activity pack" },
            { screen: "Activity Detail", emoji: "🎯", sub: "Steps + parent tip" },
            { screen: "Mark Complete",   emoji: "✅", sub: "Log + star rating" },
            { screen: "Dashboard",       emoji: "📊", sub: "Intelligence balance" },
          ].map((s, i) => (
            <div key={s.screen} className="flex items-center gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-2.5 flex items-center gap-2.5 flex-1">
                <div className="text-lg">{s.emoji}</div>
                <div>
                  <div className="text-xs font-semibold text-gray-800">{s.screen}</div>
                  <div className="text-xs text-gray-400">{s.sub}</div>
                </div>
              </div>
              {i < 5 && <div className="text-gray-400 text-xs flex-shrink-0">↓</div>}
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

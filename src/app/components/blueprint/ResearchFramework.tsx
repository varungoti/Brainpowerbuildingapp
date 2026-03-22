import React, { useState } from "react";
import { RESEARCH_REGIONS } from "./data";

export function ResearchFramework() {
  const [activeRegion, setActiveRegion] = useState<string>("indian");
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

  const region = RESEARCH_REGIONS.find((r) => r.id === activeRegion)!;

  return (
    <div>
      <MobileHeader emoji="🌍" title="Research Framework" sub="16 methods · 5 world regions" />

      {/* Region Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        {RESEARCH_REGIONS.map((r) => (
          <button
            key={r.id}
            onClick={() => { setActiveRegion(r.id); setExpandedMethod(null); }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-all"
            style={{
              background: activeRegion === r.id ? r.color : "white",
              color: activeRegion === r.id ? "white" : "#555",
              borderColor: activeRegion === r.id ? r.color : "#e5e7eb",
              fontWeight: activeRegion === r.id ? 600 : 400,
            }}
          >
            <span>{r.emoji}</span>
            <span>{r.region}</span>
          </button>
        ))}
      </div>

      {/* Method Cards */}
      <div className="space-y-3">
        {region.methods.map((method) => {
          const isExpanded = expandedMethod === method.name;
          return (
            <div
              key={method.name}
              className="rounded-2xl overflow-hidden border"
              style={{ borderColor: isExpanded ? region.color : "#e5e7eb", background: isExpanded ? region.bg : "white" }}
            >
              <button
                className="w-full text-left p-4"
                onClick={() => setExpandedMethod(isExpanded ? null : method.name)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: region.bg, color: region.color }}>
                        {region.emoji} {region.region}
                      </span>
                      <span className="text-xs text-gray-400">Ages {method.ages}</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{method.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{method.focus}</div>
                  </div>
                  <span className="text-gray-400 text-sm mt-1 flex-shrink-0">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="bg-white rounded-xl p-3">
                    <div className="text-xs font-bold mb-1" style={{ color: region.color }}>⚙️ Brain Mechanism</div>
                    <p className="text-xs text-gray-600 leading-relaxed">{method.mechanism}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3">
                    <div className="text-xs font-bold mb-1" style={{ color: region.color }}>🔬 Research Basis</div>
                    <p className="text-xs text-gray-600 leading-relaxed">{method.researchBasis}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3">
                    <div className="text-xs font-bold mb-2" style={{ color: region.color }}>🧠 Intelligence Types</div>
                    <div className="flex flex-wrap gap-1">
                      {method.intelligences.map((i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{i}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-3">
                    <div className="text-xs font-bold mb-1" style={{ color: region.color }}>🏠 Household Application</div>
                    <p className="text-xs text-gray-600 mb-2">{method.householdApplication}</p>
                    <div className="space-y-1">
                      {method.activities.map((act) => (
                        <div key={act} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span style={{ color: region.color }}>•</span> {act}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { label: "Total Methods", value: "16" },
          { label: "Research Citations", value: "30+" },
          { label: "Age Coverage", value: "1–10 yrs" },
          { label: "Cost to Parent", value: "₹0 / $0" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-3 text-center">
            <div className="text-lg font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
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

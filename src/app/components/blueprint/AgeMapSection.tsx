import { useState } from "react";
import { ageTiers } from "./data";

export function AgeMapSection() {
  const [selected, setSelected] = useState(0);
  const tier = ageTiers[selected];

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p style={{ fontSize: "0.85rem", color: "#1e40af", lineHeight: 1.6 }}>
          <strong>Design Principle:</strong> Activities must target the RIGHT intelligences at the RIGHT ages to leverage neuroplasticity windows. Each tier has distinct brain states, needs, and optimal activity formats.
        </p>
      </div>

      {/* Tier selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {ageTiers.map((t, i) => (
          <button
            key={t.tier}
            onClick={() => setSelected(i)}
            className={`flex-shrink-0 rounded-xl px-3 py-2 border transition-all ${selected === i ? "bg-[#1a1a2e] border-[#1a1a2e] text-white shadow-md scale-105" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"}`}
          >
            <div className="text-center">
              <div className="text-lg">{t.emoji}</div>
              <div style={{ fontSize: "0.7rem", fontWeight: 600 }}>{t.tier}</div>
              <div style={{ fontSize: "0.65rem", opacity: 0.8 }}>{t.age}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected tier detail */}
      <div className={`rounded-2xl border-2 p-5 ${tier.color}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{tier.emoji}</span>
              <span style={{ fontSize: "1.3rem", fontWeight: 700 }} className="text-gray-900">{tier.label}</span>
              <span className={`text-xs text-white px-2 py-0.5 rounded-full ${tier.accent}`}>{tier.tier}</span>
            </div>
            <p style={{ fontSize: "0.85rem" }} className="text-gray-600">{tier.age} · {tier.stage}</p>
          </div>
          <div className="text-right">
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }} className="text-gray-900">{tier.activityCount}</div>
            <div style={{ fontSize: "0.7rem" }} className="text-gray-500">activities</div>
          </div>
        </div>

        {/* Brain fact */}
        <div className="bg-white/70 rounded-xl p-3 mb-4">
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6b7280" }} className="uppercase tracking-wider mb-1">🧠 Brain State</p>
          <p style={{ fontSize: "0.88rem", lineHeight: 1.6 }} className="text-gray-800">{tier.brainFact}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Needs */}
          <div>
            <p style={{ fontSize: "0.78rem", fontWeight: 600 }} className="uppercase tracking-wider text-gray-500 mb-2">What the Brain Needs</p>
            <ul className="space-y-1.5">
              {tier.needs.map((need) => (
                <li key={need} className="flex items-start gap-2">
                  <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${tier.accent}`} />
                  <span style={{ fontSize: "0.82rem" }} className="text-gray-700">{need}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Activity specs */}
          <div className="space-y-3">
            <div className="bg-white/70 rounded-xl p-3">
              <p style={{ fontSize: "0.75rem", fontWeight: 600 }} className="text-gray-500 uppercase tracking-wider mb-1">Activity Duration</p>
              <p style={{ fontSize: "1rem", fontWeight: 700 }} className={tier.textAccent}>{tier.duration}</p>
            </div>

            <div className="bg-white/70 rounded-xl p-3">
              <p style={{ fontSize: "0.75rem", fontWeight: 600 }} className="text-gray-500 uppercase tracking-wider mb-2">Top Intelligence Targets</p>
              <div className="flex flex-wrap gap-1.5">
                {tier.topIntelligences.map((intel) => (
                  <span key={intel} className="text-xs bg-white border border-gray-200 text-gray-700 rounded-full px-2 py-0.5">{intel}</span>
                ))}
              </div>
            </div>

            <div className="bg-white/70 rounded-xl p-3">
              <p style={{ fontSize: "0.75rem", fontWeight: 600 }} className="text-gray-500 uppercase tracking-wider mb-2">Key Milestones</p>
              <ul className="space-y-1">
                {tier.milestones.map((m) => (
                  <li key={m} style={{ fontSize: "0.8rem" }} className="text-gray-700">• {m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Visual overview bar */}
      <div>
        <p style={{ fontSize: "0.8rem", fontWeight: 600 }} className="text-gray-500 uppercase tracking-wider mb-3">Activity Count by Tier (300 total)</p>
        <div className="space-y-2">
          {ageTiers.map((t, i) => (
            <div
              key={t.tier}
              className={`flex items-center gap-3 cursor-pointer rounded-lg p-2 transition-colors ${selected === i ? "bg-gray-100" : "hover:bg-gray-50"}`}
              onClick={() => setSelected(i)}
            >
              <span className="w-16 text-right" style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>{t.emoji} {t.tier}</span>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${t.accent} rounded-full flex items-center pl-2 transition-all`}
                  style={{ width: `${(t.activityCount / 300) * 100}%` }}
                >
                  <span className="text-white" style={{ fontSize: "0.65rem", fontWeight: 700 }}>{t.activityCount}</span>
                </div>
              </div>
              <span style={{ fontSize: "0.75rem" }} className="text-gray-500 w-12">{t.age}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

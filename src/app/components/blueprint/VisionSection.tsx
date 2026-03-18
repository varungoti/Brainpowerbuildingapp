import { neuroscience } from "./data";

export function VisionSection() {
  return (
    <div className="space-y-6">
      {/* Mission */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl p-6 text-white">
        <div className="text-3xl mb-3">🌟</div>
        <h2 className="text-white mb-2" style={{ fontSize: "1.1rem", fontWeight: 700 }}>Mission Statement</h2>
        <p className="text-white/80" style={{ fontSize: "0.95rem", lineHeight: 1.7 }}>
          To give every child in the world — regardless of income, geography, or access to resources — a daily, science-backed brain development practice using only what is already in their home.
        </p>
      </div>

      {/* North Star Metric */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⭐</div>
          <div>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#92400e" }} className="uppercase tracking-wider mb-1">North Star Metric</h3>
            <p style={{ fontSize: "1rem", fontWeight: 700, color: "#78350f" }}>"Daily Active Families"</p>
            <p style={{ fontSize: "0.85rem", color: "#92400e", lineHeight: 1.5 }} className="mt-1">
              Families completing at least 3 of 5 daily activities per day, measured weekly.
            </p>
          </div>
        </div>
      </div>

      {/* Core Promise */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💬</div>
          <div>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, color: "#065f46" }} className="uppercase tracking-wider mb-2">Core Promise to Parents</h3>
            <blockquote style={{ fontSize: "0.95rem", color: "#047857", fontStyle: "italic", lineHeight: 1.6 }}>
              "Every day, 3–5 simple activities. Zero cost. Rooted in the world's most validated child development science. Ready in 60 seconds."
            </blockquote>
          </div>
        </div>
      </div>

      {/* What it's NOT */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }} className="mb-3 text-gray-800">What This App is NOT</h3>
        <div className="space-y-2">
          {[
            ["🚫", "A screen-time activity app", "Activities happen OFFLINE, in the real world"],
            ["🚫", "A curriculum replacement", "Complementary to school, never a substitute"],
            ["🚫", "A direct child-facing app", "Parents are the user; they facilitate for the child"],
            ["🚫", "A subscription tutoring service", "Core daily activities must always be free"],
            ["🚫", "A diagnostic tool", "Not clinical — for developmental concerns, consult a pediatrician"],
          ].map(([icon, title, desc]) => (
            <div key={String(title)} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
              <span className="text-lg flex-shrink-0">{icon}</span>
              <div>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }} className="text-gray-800">{title} — </span>
                <span style={{ fontSize: "0.85rem" }} className="text-gray-600">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Neuroscience Foundation */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }} className="mb-3 text-gray-800">Neuroscience Foundation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {neuroscience.map((item) => (
            <div key={item.principle} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{item.icon}</span>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }} className="text-gray-800">{item.principle}</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.5 }} className="mb-2">{item.description}</p>
              <div className="bg-blue-50 rounded-lg px-3 py-1.5">
                <p style={{ fontSize: "0.75rem", color: "#1d4ed8" }}>
                  <span style={{ fontWeight: 600 }}>App implication: </span>{item.implication}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plasticity Windows */}
      <div className="bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-200 rounded-2xl p-5">
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }} className="mb-4 text-violet-900">🧬 Neuroplasticity Windows</h3>
        <div className="space-y-3">
          {[
            { age: "0–3 yrs", label: "Synaptic Explosion", pct: 100, color: "bg-violet-500", detail: "700 connections/sec. Sensory and emotional wiring dominates." },
            { age: "3–6 yrs", label: "Prefrontal Growth", pct: 85, color: "bg-blue-500", detail: "Language, creativity, executive function onset." },
            { age: "6–10 yrs", label: "Pruning Phase", pct: 60, color: "bg-amber-500", detail: "CRITICAL use-it-or-lose-it. Unused connections eliminated." },
          ].map((w) => (
            <div key={w.age}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }} className="text-gray-700">{w.age} — {w.label}</span>
                <span style={{ fontSize: "0.75rem" }} className="text-gray-500">{w.detail.split(".")[0]}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${w.color} rounded-full`} style={{ width: `${w.pct}%` }} />
              </div>
              <p style={{ fontSize: "0.75rem", color: "#6b7280" }} className="mt-1">{w.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

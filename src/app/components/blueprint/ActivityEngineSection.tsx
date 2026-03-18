import { sampleDay } from "./data";

export function ActivityEngineSection() {
  return (
    <div className="space-y-5">
      {/* Generation rules */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }} className="mb-3 text-gray-800">Daily Generation Rules</h3>
        <div className="space-y-3">
          {[
            { rule: "Rule 1", title: "Intelligence Balance", icon: "🧠", desc: "Cover ≥4 distinct intelligence types. No type appears as 'Primary' more than once per day. Must include 1 left-hemisphere + 1 right-hemisphere activity." },
            { rule: "Rule 2", title: "Duration Budget", icon: "⏱️", desc: "Total 5 activities: 30–75 minutes. No single activity exceeds 40% of day duration. Activities tagged by Morning (calm/focused) or Afternoon (active/creative) context." },
            { rule: "Rule 3", title: "Physical Requirement", icon: "🤸", desc: "At least 1 bodily-kinesthetic activity per day. BDNF released during movement improves encoding of subsequent cognitive activities." },
            { rule: "Rule 4", title: "Spaced Repetition Priority", icon: "📅", desc: "Skills DUE for review take priority over new skills. Maximum 2 new skills introduced per day. Skills not revisited for 7+ days auto-flagged." },
            { rule: "Rule 5", title: "Cultural Variety", icon: "🌍", desc: "Over any 7-day period, activities must draw from ≥3 different cultural traditions. Prevents cultural echo chambers." },
            { rule: "Rule 6", title: "Difficulty Arc", icon: "📈", desc: "Day: Easy → Medium → Medium → Stretch (optional). Weekly: EASY → MED → MED → MED/STRETCH → EASY → MED → STRETCH." },
            { rule: "Rule 7", title: "Material Overlap", icon: "♻️", desc: "Where possible, 2+ activities share materials per day. Reduces parent setup friction and prep cognitive load." },
            { rule: "Rule 8", title: "Novelty Balance", icon: "⚖️", desc: "60% familiar activities (builds depth) + 40% new activities (maintains engagement). Favourites never over-repeated without parent prompt." },
          ].map((r) => (
            <div key={r.rule} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-start gap-3 p-4">
                <div className="w-8 h-8 bg-[#1a1a2e] rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                  {r.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-violet-600 font-mono font-bold">{r.rule}</span>
                    <span style={{ fontWeight: 600, fontSize: "0.9rem" }} className="text-gray-900">{r.title}</span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "#6b7280", lineHeight: 1.6 }}>{r.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parent Inputs */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }} className="mb-3 text-gray-800">Optional Parent Context Inputs</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { label: "Time available today", example: '"15 min" → 3 shorter activities' },
            { label: "Materials on hand", example: '"Paper + rice" → filters to those only' },
            { label: "Focus area", example: '"Math" → biases logical-math, not exclusive' },
            { label: "Energy level", example: '"Tired" → calmer, shorter activities' },
            { label: "Indoor / Outdoor", example: "Filters to environment-appropriate" },
            { label: "Skip today", example: '"Need a break" → no guilt; SRS adjusts' },
          ].map((input) => (
            <div key={input.label} className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p style={{ fontWeight: 600, fontSize: "0.82rem" }} className="text-gray-800 mb-1">{input.label}</p>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", fontStyle: "italic" }}>{input.example}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Tracking Logic */}
      <div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-200 rounded-2xl p-5">
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }} className="mb-4 text-violet-900">📊 Progress Tracking Logic</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "Skill States", desc: "Introduced → Practising → Mastered", icon: "🌱" },
            { label: "Parent Feedback Loop", desc: "After each activity: Easy / Just Right / Struggled → feeds next day's difficulty", icon: "↩️" },
            { label: "Skill Tree", desc: "Visual map of progress across all 13 intelligence types", icon: "🌳" },
            { label: "Weekly Report", desc: "5 metrics: intelligence coverage, new skills, mastered skills, minutes, streak", icon: "📈" },
            { label: "Spaced Repetition Queue", desc: "Auto-schedules review: 1d → 3d → 7d → 21d → 60d", icon: "📅" },
            { label: "Difficulty Adjustment", desc: "Algorithm self-corrects based on ongoing parent ratings", icon: "🎯" },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl p-3 shadow-sm flex gap-3">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: "0.85rem" }} className="text-gray-800">{item.label}</p>
                <p style={{ fontSize: "0.78rem", color: "#6b7280" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Day */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ fontSize: "1rem", fontWeight: 600 }} className="text-gray-800">Sample Day — {sampleDay.child}</h3>
          <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1">{sampleDay.tier} · {sampleDay.totalMinutes} min total</span>
        </div>

        <div className="space-y-3">
          {sampleDay.activities.map((act) => (
            <div key={act.number} className={`rounded-xl border overflow-hidden ${act.isStretch ? "border-dashed border-gray-300" : "border-gray-200"} bg-white shadow-sm`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#1a1a2e] text-white flex items-center justify-center flex-shrink-0" style={{ fontSize: "0.72rem", fontWeight: 700 }}>
                      {act.number}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }} className="text-gray-900">{act.name}</span>
                    {act.isStretch && <span className="text-xs bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">Optional Stretch</span>}
                  </div>
                  <span style={{ fontSize: "0.78rem" }} className="text-gray-500 flex-shrink-0">{act.duration}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{act.culture}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${act.badge}`}>{act.primaryIntelligence}</span>
                  <span className="text-xs bg-gray-50 text-gray-500 rounded-full px-2 py-0.5">+ {act.secondaryIntelligence}</span>
                </div>

                <p style={{ fontSize: "0.82rem", color: "#4b5563", lineHeight: 1.6 }} className="mb-2">{act.description}</p>

                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                  <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#065f46" }} className="uppercase tracking-wider mb-0.5">Growth Mindset Moment</p>
                  <p style={{ fontSize: "0.8rem", color: "#047857", fontStyle: "italic" }}>{act.mindsetMoment}</p>
                </div>

                <div className="flex items-center gap-1.5 mt-2">
                  <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Materials:</span>
                  {act.materials.map((m) => (
                    <span key={m} className="text-xs bg-amber-50 text-amber-700 rounded-full px-2 py-0.5">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coverage summary */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }} className="mb-2">Today's Coverage</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {["Logical-Math ✓", "Bodily-Kinesthetic ✓", "Spatial-Visual ✓", "Linguistic ✓", "Emotional IQ ✓", "Working Memory ✓"].map((i) => (
              <span key={i} className="text-xs bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5">{i}</span>
            ))}
          </div>
          <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }} className="mb-2">Cultural Coverage</p>
          <div className="flex flex-wrap gap-1.5">
            {["🌍 Montessori", "🌍 Waldorf", "🇯🇵 Origami", "🌍 Reggio Emilia", "🇰🇷 Nunchi", "🇮🇳 Sthanapath"].map((c) => (
              <span key={c} className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">{c}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

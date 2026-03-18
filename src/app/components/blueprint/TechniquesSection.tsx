import { useState } from "react";
import { techniques } from "./data";

export function TechniquesSection() {
  const [activeCulture, setActiveCulture] = useState(0);
  const [openMethod, setOpenMethod] = useState<number | null>(null);
  const culture = techniques[activeCulture];

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p style={{ fontSize: "0.85rem", color: "#92400e", lineHeight: 1.6 }}>
          <strong>Design rule:</strong> Over any 7-day period, activities must draw from at least 3 different cultural traditions. This ensures global technique exposure and prevents cultural echo chambers.
        </p>
      </div>

      {/* Culture tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {techniques.map((t, i) => (
          <button
            key={t.culture}
            onClick={() => { setActiveCulture(i); setOpenMethod(null); }}
            className={`flex-shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 border transition-all ${activeCulture === i ? "bg-[#1a1a2e] border-[#1a1a2e] text-white shadow-md" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"}`}
          >
            <span className="text-lg">{t.flag}</span>
            <span style={{ fontSize: "0.82rem", fontWeight: 600, whiteSpace: "nowrap" }}>{t.culture}</span>
          </button>
        ))}
      </div>

      {/* Culture header */}
      <div className={`rounded-2xl border-2 p-4 ${culture.color}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{culture.flag}</span>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }} className="text-gray-900">{culture.culture} Techniques</h2>
            <p style={{ fontSize: "0.82rem" }} className="text-gray-600">{culture.methods.length} validated methods</p>
          </div>
        </div>
      </div>

      {/* Method list */}
      <div className="space-y-3">
        {culture.methods.map((method, mi) => (
          <div
            key={method.name}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Method header */}
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setOpenMethod(openMethod === mi ? null : mi)}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 ${culture.headerColor}`} />
                <div className="min-w-0">
                  <span style={{ fontWeight: 600, fontSize: "0.95rem" }} className="text-gray-900 block">{method.name}</span>
                  <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>Ages {method.ageRange}</span>
                </div>
              </div>
              <span className="text-gray-400 ml-3 flex-shrink-0">{openMethod === mi ? "▲" : "▼"}</span>
            </button>

            {/* Method detail */}
            {openMethod === mi && (
              <div className="px-4 pb-5 border-t border-gray-100 pt-4 space-y-4">

                {/* Science */}
                <div className="bg-blue-50 rounded-xl p-3">
                  <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#1e40af" }} className="uppercase tracking-wider mb-1">🔬 Neuroscience Basis</p>
                  <p style={{ fontSize: "0.85rem", color: "#1e3a8a", lineHeight: 1.6 }}>{method.science}</p>
                  <p style={{ fontSize: "0.72rem", color: "#3b82f6" }} className="mt-1 italic">Source: {method.citation}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Key points */}
                  <div>
                    <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280" }} className="uppercase tracking-wider mb-2">Key Points</p>
                    <ul className="space-y-1.5">
                      {method.keyPoints.map((kp) => (
                        <li key={kp} className="flex items-start gap-2">
                          <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                          <span style={{ fontSize: "0.82rem" }} className="text-gray-700">{kp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    {/* Materials */}
                    <div>
                      <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280" }} className="uppercase tracking-wider mb-2">Household Materials</p>
                      <div className="flex flex-wrap gap-1.5">
                        {method.materials.map((m) => (
                          <span key={m} className="text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5">{m}</span>
                        ))}
                      </div>
                    </div>

                    {/* Intelligences */}
                    <div>
                      <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280" }} className="uppercase tracking-wider mb-2">Intelligences Targeted</p>
                      <div className="space-y-1">
                        {method.intelligences.map((intel, idx) => (
                          <div key={intel} className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${idx === 0 ? "bg-violet-100 text-violet-800" : idx === 1 ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}>
                              {idx === 0 ? "Primary" : idx === 1 ? "Secondary" : "Tertiary"}
                            </span>
                            <span style={{ fontSize: "0.82rem" }} className="text-gray-700">{intel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

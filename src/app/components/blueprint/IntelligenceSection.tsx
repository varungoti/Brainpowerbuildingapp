import React, { useState } from "react";
import { INTELLIGENCE_TYPES } from "./data";

export function IntelligenceSection() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <p style={{ fontSize: "0.85rem", color: "#5b21b6", lineHeight: 1.6 }}>
          <strong>Framework source:</strong> Gardner's 8 Multiple Intelligences + 5 extensions from contemporary neuroscience (Executive Function, Working Memory, Creativity, Emotional IQ, Metacognition). Each day's 3–5 activities must collectively cover ≥4 distinct types.
        </p>
      </div>

      {/* Daily coverage rule */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { rule: "≥4", label: "Intelligence types per day" },
          { rule: "2x", label: "Max per-type per day" },
          { rule: "1+", label: "Left-hemisphere activity" },
          { rule: "1+", label: "Right-hemisphere activity" },
        ].map((r) => (
          <div key={r.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#4f46e5" }}>{r.rule}</div>
            <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>{r.label}</div>
          </div>
        ))}
      </div>

      {/* Intelligence grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {INTELLIGENCE_TYPES.map((intel) => (
          <div
            key={intel.id}
            className={`rounded-xl border cursor-pointer transition-all overflow-hidden ${selected === intel.id ? "border-gray-400 shadow-md" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"}`}
            onClick={() => setSelected(selected === intel.id ? null : intel.id)}
          >
            <div className="flex items-center gap-3 p-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: intel.bg }}
              >
                {intel.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }} className="text-gray-900">{intel.name}</span>
                  <span style={{ fontSize: "0.72rem" }} className="text-gray-500 flex-shrink-0">Peak {intel.developmentPeak}</span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "#9ca3af" }} className="truncate">{intel.brainRegion}</p>
              </div>
              <span className="text-gray-400" style={{ fontSize: "0.8rem" }}>{selected === intel.id ? "▲" : "▼"}</span>
            </div>

            {selected === intel.id && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <p style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6b7280" }} className="uppercase tracking-wider mb-2">Key Techniques</p>
                    <div className="flex flex-wrap gap-1.5">
                      {intel.methods.map((t) => (
                        <span
                          key={t}
                          className="text-xs px-2.5 py-1 rounded-full font-medium text-gray-800 border border-gray-200"
                          style={{ backgroundColor: intel.bg }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5">
                    <p style={{ fontSize: "0.78rem", color: "#6b7280" }}>
                      <span style={{ fontWeight: 600 }}>Brain region: </span>{intel.brainRegion}
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "#6b7280" }} className="mt-0.5">
                      <span style={{ fontWeight: 600 }}>Optimal window: </span>{intel.developmentPeak}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hemisphere map */}
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 600 }} className="mb-3 text-gray-800">Brain Hemisphere Coverage</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1e40af" }} className="uppercase tracking-wider mb-3">Left Hemisphere</p>
            <div className="space-y-1.5">
              {["Linguistic", "Logical-Mathematical", "Executive Function", "Working Memory", "Metacognition"].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <span style={{ fontSize: "0.82rem" }} className="text-blue-900">{i}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#9f1239" }} className="uppercase tracking-wider mb-3">Right Hemisphere</p>
            <div className="space-y-1.5">
              {["Spatial-Visual", "Musical-Rhythmic", "Creativity", "Emotional IQ", "Bodily-Kinesthetic"].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                  <span style={{ fontSize: "0.82rem" }} className="text-rose-900">{i}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mt-3">
          <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6d28d9" }} className="mb-1">Bilateral / Cross-hemisphere</p>
          <div className="flex flex-wrap gap-1.5">
            {["Interpersonal", "Naturalist", "Intrapersonal"].map((i) => (
              <span key={i} className="text-xs bg-purple-100 text-purple-800 rounded-full px-2 py-0.5">{i}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

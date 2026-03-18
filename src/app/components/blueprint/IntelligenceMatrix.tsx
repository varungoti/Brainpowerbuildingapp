import { useState } from "react";
import { INTELLIGENCE_TYPES } from "./data";

export function IntelligenceMatrix() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedIntel = INTELLIGENCE_TYPES.find((i) => i.id === selected);

  return (
    <div>
      <MobileHeader emoji="🧠" title="13 Intelligence Types" sub="Gardner + EQ + Creative + Executive Fn" />

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Framework:</strong> Gardner's 8 (1983) + Naturalist (1995) + Existential + Emotional (Goleman) + Creative (Torrance) + Executive Function (Diamond). Tap any card to explore.
        </p>
      </div>

      {/* Intelligence Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {INTELLIGENCE_TYPES.map((intel) => {
          const isSelected = selected === intel.id;
          return (
            <button
              key={intel.id}
              onClick={() => setSelected(isSelected ? null : intel.id)}
              className="rounded-2xl p-3 text-center border-2 transition-all"
              style={{
                background: isSelected ? intel.color : intel.bg,
                borderColor: isSelected ? intel.color : "transparent",
              }}
            >
              <div className="text-xl mb-1">{intel.emoji}</div>
              <div className="text-xs font-bold leading-tight" style={{ color: isSelected ? "white" : intel.color }}>
                #{intel.number}
              </div>
              <div className="text-xs leading-tight mt-0.5" style={{ color: isSelected ? "rgba(255,255,255,0.9)" : "#374151" }}>
                {intel.name.split("-")[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail Panel */}
      {selectedIntel && (
        <div className="rounded-2xl border-2 p-4 mb-4" style={{ background: selectedIntel.bg, borderColor: selectedIntel.color }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{selectedIntel.emoji}</span>
            <div>
              <div className="text-xs font-bold" style={{ color: selectedIntel.color }}>#{selectedIntel.number} · {selectedIntel.origin}</div>
              <div className="font-bold text-gray-900 text-sm">{selectedIntel.name}</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">{selectedIntel.description}</p>

          <div className="space-y-2">
            <InfoRow label="🧠 Brain Region" value={selectedIntel.brainRegion} color={selectedIntel.color} />
            <InfoRow label="⏰ Dev. Peak" value={selectedIntel.developmentPeak} color={selectedIntel.color} />
          </div>

          <div className="mt-3">
            <div className="text-xs font-bold mb-1.5" style={{ color: selectedIntel.color }}>⚡ Core Skills</div>
            <div className="flex flex-wrap gap-1">
              {selectedIntel.coreSkills.map((skill) => (
                <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-white text-gray-600">{skill}</span>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs font-bold mb-1.5" style={{ color: selectedIntel.color }}>🔬 Methods That Target This</div>
            <div className="flex flex-wrap gap-1">
              {selectedIntel.methods.map((m) => (
                <span key={m} className="text-xs px-2 py-0.5 rounded-full" style={{ background: selectedIntel.color + "20", color: selectedIntel.color }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coverage Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-bold text-gray-800">Intelligence × Region Coverage</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: 11 }}>
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-2 text-gray-500 font-semibold min-w-[110px]">Type</th>
                <th className="p-2 text-gray-500 font-semibold">🇮🇳</th>
                <th className="p-2 text-gray-500 font-semibold">🇨🇳</th>
                <th className="p-2 text-gray-500 font-semibold">🇯🇵</th>
                <th className="p-2 text-gray-500 font-semibold">🇰🇷</th>
                <th className="p-2 text-gray-500 font-semibold">🌍</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Linguistic", v: ["●●", "●", "●●", "●", "●●●"] },
                { name: "Logical-Math", v: ["●●●", "●●●", "●●", "●●●", "●●"] },
                { name: "Spatial", v: ["●●", "●●", "●●●", "●●", "●●"] },
                { name: "Musical", v: ["●●", "●", "●●", "○", "●●●"] },
                { name: "Kinesthetic", v: ["●●●", "●", "●●●", "○", "●●●"] },
                { name: "Interpersonal", v: ["●", "●", "●", "●●●", "●●●"] },
                { name: "Intrapersonal", v: ["●●●", "●", "●●", "●●", "●●●"] },
                { name: "Naturalist", v: ["●", "○", "●●●", "○", "●●●"] },
                { name: "Emotional EQ", v: ["●●", "○", "●", "●●●", "●●●"] },
                { name: "Creative", v: ["●●", "●●", "●●", "●", "●●●"] },
                { name: "Exec. Function", v: ["●●", "●●●", "●●●", "●●", "●●●"] },
              ].map((row, i) => (
                <tr key={row.name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}>
                  <td className="p-2 font-medium text-gray-700">{row.name}</td>
                  {row.v.map((val, j) => (
                    <td key={j} className="p-2 text-center" style={{
                      color: val === "●●●" ? "#2DC653" : val === "●●" ? "#4361EE" : val === "●" ? "#FFB703" : "#E5E7EB"
                    }}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-3 text-xs text-gray-400">
          <span><span className="text-green-500">●●●</span> Strong</span>
          <span><span className="text-blue-500">●●</span> Moderate</span>
          <span><span className="text-yellow-500">●</span> Light</span>
          <span><span className="text-gray-300">○</span> Minimal</span>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-2.5">
      <div className="text-xs font-bold mb-0.5" style={{ color }}>{label}</div>
      <p className="text-xs text-gray-600">{value}</p>
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

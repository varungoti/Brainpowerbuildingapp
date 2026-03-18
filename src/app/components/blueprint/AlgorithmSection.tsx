import { ALGORITHM } from "./data";

export function AlgorithmSection() {
  return (
    <div>
      <MobileHeader emoji="🧮" title="AGE Algorithm" sub="Activity Generation Engine · 7 phases" />

      {/* Overview */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-4">
        <div className="text-xs font-bold text-gray-400 mb-2 tracking-widest">OVERVIEW</div>
        <p className="text-gray-300 text-xs leading-relaxed">{ALGORITHM.overview}</p>

        {/* Flow */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          {["Child Profile", "Materials", "Time", "Mood"].map((input, i) => (
            <div key={input} className="flex items-center gap-1.5 flex-shrink-0">
              <div className="bg-gray-700 rounded-lg px-2.5 py-1.5 text-center">
                <div className="text-gray-500 text-xs" style={{ fontSize: 9 }}>INPUT</div>
                <div className="text-gray-300 text-xs font-medium">{input}</div>
              </div>
              {i < 3 && <span className="text-gray-600 text-xs">+</span>}
            </div>
          ))}
          <span className="text-gray-500 text-base flex-shrink-0 mx-1">→</span>
          <div className="bg-blue-600 rounded-xl px-3 py-2 text-center flex-shrink-0">
            <div className="text-blue-300 text-xs" style={{ fontSize: 9 }}>ENGINE</div>
            <div className="text-white text-sm font-bold">AGE</div>
          </div>
          <span className="text-gray-500 text-base flex-shrink-0 mx-1">→</span>
          <div className="bg-green-700 rounded-xl px-3 py-2 text-center flex-shrink-0">
            <div className="text-green-300 text-xs" style={{ fontSize: 9 }}>OUTPUT</div>
            <div className="text-white text-xs font-bold">3–5 Acts</div>
          </div>
        </div>
      </div>

      {/* Scoring Weights */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-bold text-gray-800">⚖️ Scoring Weight Matrix</div>
        </div>
        <div className="p-4 space-y-3">
          {ALGORITHM.scoringFactors.map((factor) => (
            <div key={factor.factor}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-gray-700">{factor.factor}</span>
                <span className="font-bold text-purple-600">{factor.weight}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                <div className="h-1.5 rounded-full" style={{ width: `${factor.weight * 3.3}%`, background: "#7209B7" }} />
              </div>
              <p className="text-xs text-gray-400">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7 Phases */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-bold text-gray-800">🔄 7 Processing Phases</div>
        </div>
        <div className="divide-y divide-gray-100">
          {ALGORITHM.phases.map((phase, i) => (
            <div key={phase.phase} className="flex items-start gap-3 p-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: `hsl(${140 + i * 15}, 60%, 45%)` }}>
                {i + 1}
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-800">{phase.phase.split(" — ")[1]}</div>
                <p className="text-xs text-gray-500 mt-0.5">{phase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hard Rules */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <div className="text-sm font-bold text-amber-800 mb-3">📜 8 Hard Rules</div>
        <div className="space-y-2">
          {ALGORITHM.rules.map((rule) => (
            <div key={rule} className="flex items-start gap-2">
              <span className="text-amber-500 flex-shrink-0 mt-0.5">▸</span>
              <p className="text-xs text-amber-900 leading-relaxed">{rule}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Output JSON */}
      <div className="bg-gray-900 rounded-2xl p-4">
        <div className="text-xs font-bold text-gray-400 mb-3 tracking-widest">📦 ACTIVITY OUTPUT SCHEMA</div>
        <pre className="text-xs text-blue-300 leading-relaxed overflow-x-auto">
{`{
  "id": "uuid",
  "name": "Button Abacus",
  "duration": 15,
  "materials": [
    "buttons",
    "egg carton"
  ],
  "intelligence": [
    "Logical-Math",
    "Spatial"
  ],
  "method": "Abacus",
  "region": "Chinese",
  "ageTiers": [3, 4],
  "difficulty": 2,
  "parentTip": "..."
}`}
        </pre>
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

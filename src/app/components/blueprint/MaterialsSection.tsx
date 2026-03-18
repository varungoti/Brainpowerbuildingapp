import { useState } from "react";
import { MATERIALS_CATEGORIES } from "./data";

export function MaterialsSection() {
  const [activeCategory, setActiveCategory] = useState<string>("Kitchen & Food");
  const [searchQuery, setSearchQuery] = useState("");

  const allMaterials = MATERIALS_CATEGORIES.flatMap((c) =>
    c.materials.map((m) => ({ ...m, category: c.category, color: c.color, bg: c.bg }))
  );

  const filtered = searchQuery
    ? allMaterials.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.uses.some((u) => u.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : null;

  const activeData = MATERIALS_CATEGORIES.find((c) => c.category === activeCategory)!;

  return (
    <div>
      <MobileHeader emoji="🏠" title="Materials Library" sub="80+ zero-cost household items" />

      <div className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-4">
        <p className="text-xs text-green-800 leading-relaxed">
          <strong>Zero-cost principle:</strong> Every activity uses only items already found in the average home. No purchases needed. Globally available across India, SE Asia, Africa, and Western households.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search materials or uses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-gray-200 bg-white rounded-2xl px-4 py-3 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <span className="absolute left-3 top-3.5 text-gray-400 text-sm">🔍</span>
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3.5 text-gray-400 text-sm">✕</button>
        )}
      </div>

      {/* Search Results */}
      {filtered && (
        <>
          <div className="text-xs text-gray-500 mb-3">{filtered.length} materials found</div>
          <div className="space-y-2">
            {filtered.map((m) => (
              <MaterialCard key={m.name} material={m} color={m.color} bg={m.bg} />
            ))}
          </div>
        </>
      )}

      {!filtered && (
        <>
          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
            {MATERIALS_CATEGORIES.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
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
                <span className="opacity-70">({cat.materials.length})</span>
              </button>
            ))}
          </div>

          {/* Materials List */}
          <div className="space-y-2 mb-4">
            {activeData.materials.map((m) => (
              <MaterialCard key={m.name} material={m} color={activeData.color} bg={activeData.bg} />
            ))}
          </div>
        </>
      )}

      {/* Category Summary */}
      <div className="grid grid-cols-5 gap-2">
        {MATERIALS_CATEGORIES.map((cat) => (
          <button
            key={cat.category}
            className="rounded-2xl p-2 text-center border transition-all"
            style={{ background: cat.bg, borderColor: `${cat.color}40` }}
            onClick={() => { setActiveCategory(cat.category); setSearchQuery(""); }}
          >
            <div className="text-xl mb-0.5">{cat.emoji}</div>
            <div className="text-sm font-bold" style={{ color: cat.color }}>{cat.materials.length}</div>
          </button>
        ))}
      </div>

      <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3">
        <p className="text-xs text-red-700">
          <strong>🔐 Safety:</strong> All materials include a <code className="bg-red-100 px-0.5 rounded">safety_age_min</code> field. Small objects (buttons, beans) are never suggested for under 36 months without supervision flags.
        </p>
      </div>
    </div>
  );
}

function MaterialCard({
  material, color, bg,
}: {
  material: { name: string; uses: string[]; safeAge: number };
  color: string; bg: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-800">{material.name}</span>
        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: bg, color, border: `1px solid ${color}40` }}>
          Age {material.safeAge}+
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {material.uses.map((use) => (
          <span key={use} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{use}</span>
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

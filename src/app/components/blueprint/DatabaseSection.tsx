import { useState } from "react";
import { DATABASE_SCHEMA, CONTENT_TARGETS } from "./data";

export function DatabaseSection() {
  const [activeCollection, setActiveCollection] = useState<string>("activities");
  const collection = DATABASE_SCHEMA.collections.find((c) => c.name === activeCollection)!;

  return (
    <div>
      <MobileHeader emoji="🗄️" title="Database Schema" sub="7 collections · field types · content targets" />

      {/* Collection Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        {DATABASE_SCHEMA.collections.map((col) => (
          <button
            key={col.name}
            onClick={() => setActiveCollection(col.name)}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs transition-all"
            style={{
              background: activeCollection === col.name ? col.color : "white",
              color: activeCollection === col.name ? "white" : "#555",
              borderColor: activeCollection === col.name ? col.color : "#e5e7eb",
              fontWeight: activeCollection === col.name ? 600 : 400,
            }}
          >
            <span>{col.icon}</span>
            <span className="font-mono">{col.name}</span>
          </button>
        ))}
      </div>

      {/* Collection Detail */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100" style={{ background: `${collection.color}10` }}>
          <span className="text-2xl">{collection.icon}</span>
          <div>
            <span className="font-bold font-mono text-sm" style={{ color: collection.color }}>{collection.name}</span>
            <p className="text-xs text-gray-500 mt-0.5">{collection.description}</p>
            <p className="text-xs text-gray-400 mt-0.5">Records: {collection.estimatedRecords}</p>
          </div>
        </div>
        <table className="w-full" style={{ fontSize: 11 }}>
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left p-2.5 text-gray-500 font-semibold">Field</th>
              <th className="text-left p-2.5 text-gray-500 font-semibold">Type</th>
              <th className="p-2.5 text-gray-500 font-semibold">Req</th>
            </tr>
          </thead>
          <tbody>
            {collection.fields.map((field, i) => (
              <tr key={field.name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                <td className="p-2.5">
                  <span className="font-mono font-semibold"
                    style={{ color: field.key ? "#E63946" : field.required ? collection.color : "#888" }}>
                    {field.key ? "🔑 " : ""}{field.name}
                  </span>
                </td>
                <td className="p-2.5">
                  <span className="font-mono text-gray-500 bg-gray-100 px-1 py-0.5 rounded text-xs">{field.type}</span>
                </td>
                <td className="p-2.5 text-center">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    field.key ? "bg-red-100 text-red-600" :
                    field.required ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {field.key ? "PK" : field.required ? "✓" : "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Relationships */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-4">
        <div className="text-xs font-bold text-gray-400 mb-3 tracking-widest">ENTITY RELATIONSHIPS</div>
        <div className="space-y-2">
          {[
            { from: "child_profiles", arrow: "1:N", to: "activity_logs" },
            { from: "child_profiles", arrow: "1:N", to: "daily_packs" },
            { from: "activities", arrow: "N:N", to: "materials" },
            { from: "activities", arrow: "N:N", to: "intelligences" },
            { from: "activities", arrow: "N:1", to: "methods" },
            { from: "daily_packs", arrow: "N:N", to: "activities" },
          ].map((rel, i) => (
            <div key={i} className="flex items-center gap-2 text-xs bg-gray-800 rounded-lg px-3 py-2">
              <span className="font-mono text-blue-300">{rel.from}</span>
              <span className="text-yellow-400 font-bold">{rel.arrow}</span>
              <span className="font-mono text-blue-300">{rel.to}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content Volume */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <div className="text-sm font-bold text-gray-800 mb-3">📊 Activity Content Targets</div>
        <div className="space-y-3">
          {[
            { label: "MVP Launch", value: CONTENT_TARGETS.mvpActivities, color: "#FB5607" },
            { label: "Version 1.0", value: CONTENT_TARGETS.v1Activities, color: "#4361EE" },
            { label: "Version 2.0", value: CONTENT_TARGETS.v2Activities, color: "#7209B7" },
            { label: "Full Library", value: CONTENT_TARGETS.fullActivities, color: "#2DC653" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-bold" style={{ color: item.color }}>{item.value} activities</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="h-2 rounded-full" style={{ width: `${(item.value / 1000) * 100}%`, background: item.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By region */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="text-sm font-bold text-gray-800 mb-3">MVP Distribution by Region (150 total)</div>
        <div className="space-y-2">
          {CONTENT_TARGETS.byRegion.map((r) => (
            <div key={r.region} className="flex items-center gap-2">
              <div className="w-24 text-xs text-gray-600 flex-shrink-0">{r.region}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${r.percent}%` }} />
              </div>
              <div className="text-xs font-semibold text-gray-700 w-14 text-right">{r.count} ({r.percent}%)</div>
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

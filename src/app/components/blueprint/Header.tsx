export function BlueprintHeader() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-8 left-8 w-32 h-32 rounded-full border-2 border-white/30" />
        <div className="absolute top-16 left-16 w-20 h-20 rounded-full border border-white/20" />
        <div className="absolute bottom-8 right-8 w-48 h-48 rounded-full border-2 border-white/20" />
        <div className="absolute top-4 right-1/3 w-16 h-16 rounded-full border border-white/20" />
      </div>

      <div className="relative px-6 py-10 max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/80 tracking-widest uppercase">Research Blueprint — v1.0 · Pre-Development Phase</span>
        </div>

        {/* Title */}
        <h1 className="text-white mb-2" style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.2 }}>
          NuroSprout
        </h1>
        <p className="text-white/60 mb-4" style={{ fontSize: "0.85rem" }}>Brain Development App for Children Ages 1–10</p>

        {/* Tagline */}
        <p className="text-white/90 mb-8 max-w-2xl" style={{ fontSize: "1.1rem", lineHeight: 1.6 }}>
          A globally-researched, zero-cost, household-material activity system for holistic brain development — built on neuroscience, delivered through parents.
        </p>

        {/* Key stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: "13", label: "Intelligence Types", icon: "🧠" },
            { value: "300+", label: "Activities (MVP)", icon: "🎯" },
            { value: "7", label: "Age Tiers", icon: "📊" },
            { value: "5", label: "Cultural Traditions", icon: "🌍" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-white" style={{ fontSize: "1.4rem", fontWeight: 700 }}>{stat.value}</div>
              <div className="text-white/60" style={{ fontSize: "0.7rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { APP_META } from "./data";

export function CoverSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0d1b2a] p-5 mb-4">
      <div className="absolute top-3 right-4 text-4xl opacity-10 select-none">🧠</div>
      <div className="absolute bottom-3 left-4 text-3xl opacity-10 select-none">🌱</div>

      <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-[#06D6A0] animate-pulse" />
        <span className="text-white/70 text-xs">{APP_META.phase} · {APP_META.date}</span>
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-3xl">🧠</span>
        <h1 className="text-white" style={{ fontSize: "1.8rem", fontWeight: 800, lineHeight: 1 }}>
          {APP_META.name}
        </h1>
      </div>
      <p className="text-white/50 text-xs mb-4">{APP_META.tagline}</p>

      <div className="flex flex-wrap gap-2">
        {[
          { label: "Age Range", value: APP_META.targetAge, icon: "👶" },
          { label: "Daily Activities", value: APP_META.dailyActivities, icon: "🎯" },
          { label: "Cost", value: "Zero ₹/$", icon: "✅" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/10 border border-white/15 rounded-xl px-3 py-2">
            <div className="text-white/40 text-xs">{stat.icon} {stat.label}</div>
            <div className="text-white text-xs font-semibold">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

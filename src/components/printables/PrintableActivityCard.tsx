import type { PrintableGuideActivity } from "../../lib/printables/guideTypes";

export function PrintableActivityCard({ activity, index }: { activity: PrintableGuideActivity; index: number }) {
  return (
    <section className="rounded-3xl border border-violet-100 bg-white p-4 shadow-sm break-inside-avoid">
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-3xl overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl" style={{ background: "linear-gradient(135deg,#F5F3FF,#FFE4F1)" }}>
          {activity.illustration.url ? (
            <img src={activity.illustration.url} alt={activity.illustration.alt} className="w-full h-full object-cover" />
          ) : (
            <span>{activity.illustration.fallbackIcon}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-violet-500">Activity {index + 1} · {activity.duration} min</div>
          <h3 className="text-gray-950 font-black text-base">{activity.title}</h3>
          <p className="text-gray-600 text-xs leading-relaxed mt-1">{activity.whyThisMatters}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <div className="rounded-2xl p-3 bg-violet-50">
          <div className="text-violet-800 font-bold text-xs mb-2">Steps</div>
          <ol className="space-y-1.5">
            {activity.steps.map((step, i) => (
              <li key={i} className="text-xs text-violet-950 leading-relaxed flex gap-2">
                <span className="w-5 h-5 rounded-full text-white flex-shrink-0 text-[10px] flex items-center justify-center" style={{ background: "#7209B7" }}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-2">
          <InfoBlock title="Say This" items={activity.sayThis} color="#4361EE" bg="#EEF2FF" />
          <InfoBlock title="Watch For" items={activity.watchFor} color="#047857" bg="#ECFDF5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
        <MiniNote title="Too Easy" text={activity.adaptIfTooEasy} />
        <MiniNote title="Too Hard" text={activity.adaptIfTooHard} />
        <MiniNote title="Safety" text={activity.safetyNote} />
      </div>

      <div className="mt-3 rounded-2xl p-3 border border-amber-100 bg-amber-50 text-amber-900 text-xs">
        <strong>Reflect:</strong> {activity.reflectionPrompt}
      </div>
    </section>
  );
}

function InfoBlock({ title, items, color, bg }: { title: string; items: string[]; color: string; bg: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: bg }}>
      <div className="font-bold text-xs mb-1" style={{ color }}>{title}</div>
      <ul className="space-y-1">
        {items.map((item, i) => <li key={i} className="text-xs text-gray-700 leading-relaxed">• {item}</li>)}
      </ul>
    </div>
  );
}

function MiniNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3">
      <div className="text-gray-500 font-black text-[10px] uppercase tracking-widest">{title}</div>
      <div className="text-gray-800 text-xs leading-relaxed mt-1">{text}</div>
    </div>
  );
}

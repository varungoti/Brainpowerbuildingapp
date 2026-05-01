import type { PrintableGuide } from "../../lib/printables/guideTypes";
import { PrintableActivityCard } from "./PrintableActivityCard";

export function PrintableGuidePreview({ guide }: { guide: PrintableGuide }) {
  return (
    <article id="printable-guide-preview" className="rounded-3xl overflow-hidden bg-white shadow-sm border border-violet-100">
      <header className="p-5 text-white" style={{ background: "linear-gradient(135deg,#4361EE,#7209B7,#F72585)" }}>
        <div className="text-white/75 text-xs font-bold uppercase tracking-widest">Printable Parent Guide</div>
        <h2 className="text-2xl font-black mt-1">{guide.title}</h2>
        <p className="text-white/85 text-sm mt-1">{guide.subtitle}</p>
        <div className="flex gap-2 flex-wrap mt-3 text-xs">
          <span className="rounded-full px-3 py-1 bg-white/20">{guide.totalMinutes} minutes</span>
          <span className="rounded-full px-3 py-1 bg-white/20">Tier {guide.ageTier}</span>
          <span className="rounded-full px-3 py-1 bg-white/20">{guide.provider ?? "fallback"}</span>
        </div>
      </header>

      <div className="p-4 space-y-4" style={{ background: "linear-gradient(180deg,#FFFFFF,#F8F7FF)" }}>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-3xl p-4 bg-emerald-50 border border-emerald-100">
            <div className="text-emerald-800 font-black text-xs uppercase tracking-widest mb-2">Prep Checklist</div>
            <ul className="space-y-1.5">
              {guide.prepChecklist.map((item, i) => (
                <li key={i} className="text-sm text-emerald-950 leading-relaxed">□ {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl p-4 bg-amber-50 border border-amber-100">
            <div className="text-amber-800 font-black text-xs uppercase tracking-widest mb-2">Materials</div>
            <div className="flex flex-wrap gap-1.5">
              {guide.materials.map((item) => (
                <span key={item} className="text-xs rounded-full px-2 py-1 bg-white border border-amber-200 text-amber-900">{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl p-4 bg-sky-50 border border-sky-100">
          <div className="text-sky-800 font-black text-xs uppercase tracking-widest mb-2">Daily Flow</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <RoutineStep title="Warm-Up" text={guide.routine.warmUp} />
            <RoutineStep title="Main Play" text={guide.routine.mainPlay} />
            <RoutineStep title="Calm Close" text={guide.routine.calmClose} />
            <RoutineStep title="Reflect" text={guide.routine.parentReflection} />
          </div>
        </section>

        <div className="space-y-4">
          {guide.activities.map((activity, i) => (
            <PrintableActivityCard key={activity.activityId} activity={activity} index={i} />
          ))}
        </div>

        <footer className="rounded-3xl p-4 bg-gray-900 text-white/85 text-xs leading-relaxed">
          {guide.footer}
        </footer>
      </div>
    </article>
  );
}

function RoutineStep({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 border border-sky-100">
      <div className="text-sky-700 font-bold text-xs">{title}</div>
      <p className="text-gray-700 text-xs leading-relaxed mt-1">{text}</p>
    </div>
  );
}

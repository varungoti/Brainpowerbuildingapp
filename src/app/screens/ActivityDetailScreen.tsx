import React from "react";
import { useApp } from "../context/AppContext";
import { INTEL_COLORS, SKILL_TAG_UI } from "../data/activities";

export function ActivityDetailScreen() {
  const { viewingActivity, goBack, setViewingActivity } = useApp();

  if (!viewingActivity) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center" style={{ background: "#F0EFFF" }}>
        <div className="bg-white rounded-3xl border border-gray-100 p-6 max-w-sm shadow-sm">
          <div className="text-4xl mb-3">🧩</div>
          <div className="text-gray-900 font-black text-lg mb-2">No activity selected</div>
          <p className="text-gray-500 text-sm mb-4">
            Pick an activity from your generated pack or history to see the full instructions and parent guidance.
          </p>
          <button
            type="button"
            onClick={goBack}
            className="w-full py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#F0EFFF" }}>
      <div className="relative overflow-hidden rounded-b-3xl mb-4" style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>
        <div className="absolute right-0 top-0 w-28 h-28 rounded-full opacity-20" style={{ background: "rgba(255,255,255,0.25)", transform: "translate(28%,-28%)" }} />
        <div className="relative px-4 pt-3 pb-5">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center text-3xl">{viewingActivity.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="text-white/70 text-xs mb-1">
                {viewingActivity.regionEmoji} {viewingActivity.region} · {viewingActivity.method}
              </div>
              <div className="text-white font-black text-xl leading-tight">{viewingActivity.name}</div>
              <div className="text-white/80 text-xs mt-1">⏱ {viewingActivity.duration} min · Age tiers {viewingActivity.ageTiers.join(", ")}</div>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap mt-3">
            {viewingActivity.skillTags?.map((tag) => {
              const meta = SKILL_TAG_UI[tag];
              if (!meta) return null;
              return (
                <span key={tag} className="text-xs px-2 py-1 rounded-full font-semibold text-white/95" style={{ background: "rgba(255,255,255,0.16)" }}>
                  {meta.emoji} {meta.label}
                </span>
              );
            })}
            {viewingActivity.intelligences.map((intel) => (
              <span key={intel} className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: "#fff", color: INTEL_COLORS[intel] ?? "#555" }}>
                {intel}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-3">
        <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
          <div className="text-gray-900 font-black text-sm mb-2">What this activity builds</div>
          <p className="text-gray-600 text-sm leading-relaxed">{viewingActivity.description}</p>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
          <div className="text-gray-900 font-black text-sm mb-2">Materials</div>
          {viewingActivity.materials.length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {viewingActivity.materials.map((material) => (
                <span key={material} className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-700 font-semibold">
                  {material}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No special materials needed.</p>
          )}
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
          <div className="text-gray-900 font-black text-sm mb-2">Curriculum metadata</div>
          <div className="flex gap-2 flex-wrap mb-2">
            {viewingActivity.goalPillars?.map((pillar) => (
              <span key={pillar} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                {pillar}
              </span>
            ))}
            {viewingActivity.reviewStatus && (
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                {viewingActivity.reviewStatus}
              </span>
            )}
          </div>
          <div className="text-gray-500 text-xs leading-relaxed">
            Mechanisms: {(viewingActivity.mechanismTags ?? []).join(", ") || "General developmental play"}.
          </div>
          <div className="text-gray-500 text-xs leading-relaxed mt-1">
            Milestone links: {(viewingActivity.milestoneIds ?? []).length > 0 ? viewingActivity.milestoneIds?.join(", ") : "None attached yet"}.
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
          <div className="text-gray-900 font-black text-sm mb-2">Step-by-step</div>
          <ol className="space-y-2">
            {viewingActivity.instructions.map((step, idx) => (
              <li key={`${viewingActivity.id}-${idx}`} className="flex items-start gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}>
                  {idx + 1}
                </span>
                <span className="text-gray-700 text-sm leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-white rounded-3xl border border-violet-100 p-4 shadow-sm" style={{ background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)" }}>
          <div className="text-gray-900 font-black text-sm mb-2">Why this matters</div>
          <p className="text-gray-700 text-sm leading-relaxed">{viewingActivity.parentTip}</p>
        </section>

        {viewingActivity.extensionIdeas?.length ? (
          <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
            <div className="text-gray-900 font-black text-sm mb-2">Extend the activity</div>
            <ul className="space-y-2">
              {viewingActivity.extensionIdeas.map((idea) => (
                <li key={idea} className="text-gray-700 text-sm leading-relaxed">
                  • {idea}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {viewingActivity.contraindications?.length ? (
          <section className="bg-white rounded-3xl border border-amber-100 p-4 shadow-sm" style={{ background: "#FFFBEF" }}>
            <div className="text-amber-800 font-black text-sm mb-2">Adapt carefully</div>
            <ul className="space-y-2">
              {viewingActivity.contraindications.map((note) => (
                <li key={note} className="text-amber-900 text-sm leading-relaxed">
                  • {note}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setViewingActivity(null);
            goBack();
          }}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg,#14213D,#3A0CA3)" }}
        >
          Back to activities
        </button>
      </div>
    </div>
  );
}

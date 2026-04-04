import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { INTEL_COLORS, SKILL_TAG_UI } from "../data/activities";
import { generateCoaching } from "../../lib/coaching/parentCoachingEngine";
import { adaptActivity } from "../../lib/sensory/sensoryAdapter";
import { buildActivityNarration } from "../../lib/voice/voicePromptBuilder";
import { communityScoreBonus } from "../../lib/community/communityScorer";
import { CoachingOverlay } from "../../components/coaching/CoachingOverlay";
import { SensoryBadge } from "../../components/sensory/SensoryBadge";
import { ModificationPanel } from "../../components/sensory/ModificationPanel";
import { CommunityBadge } from "../../components/community/CommunityBadge";
import { VoicePlayerBar } from "../../components/voice/VoicePlayerBar";

export function ActivityDetailScreen() {
  const { viewingActivity, goBack, setViewingActivity, activeChild, sensoryProfiles, locale, communityRatingCache } = useApp();
  const [showCoaching, setShowCoaching] = useState(false);
  const [activeTab, setActiveTab] = useState<"steps" | "coaching" | "sensory">("steps");

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

      <ActivityDetailBody
        viewingActivity={viewingActivity}
        activeChild={activeChild}
        sensoryProfiles={sensoryProfiles}
        locale={locale}
        communityRatingCache={communityRatingCache}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showCoaching={showCoaching}
        setShowCoaching={setShowCoaching}
        goBack={goBack}
        setViewingActivity={setViewingActivity}
      />
    </div>
  );
}

function ActivityDetailBody({ viewingActivity, activeChild, sensoryProfiles, locale, communityRatingCache, activeTab, setActiveTab, showCoaching, setShowCoaching, goBack, setViewingActivity }: {
  viewingActivity: NonNullable<ReturnType<typeof useApp>["viewingActivity"]>;
  activeChild: ReturnType<typeof useApp>["activeChild"];
  sensoryProfiles: ReturnType<typeof useApp>["sensoryProfiles"];
  locale: ReturnType<typeof useApp>["locale"];
  communityRatingCache: ReturnType<typeof useApp>["communityRatingCache"];
  activeTab: "steps" | "coaching" | "sensory";
  setActiveTab: (t: "steps" | "coaching" | "sensory") => void;
  showCoaching: boolean;
  setShowCoaching: (v: boolean) => void;
  goBack: () => void;
  setViewingActivity: (a: null) => void;
}) {
  const coaching = useMemo(() => generateCoaching(viewingActivity), [viewingActivity]);

  const childId = activeChild?.id ?? "";
  const sensoryProfile = sensoryProfiles?.[childId];
  const adaptation = useMemo(
    () => sensoryProfile ? adaptActivity(viewingActivity, sensoryProfile) : null,
    [viewingActivity, sensoryProfile],
  );

  const narrationText = useMemo(
    () => buildActivityNarration(viewingActivity, activeChild?.name),
    [viewingActivity, activeChild?.name],
  );

  const rating = communityRatingCache?.ratings[viewingActivity.id];
  void communityScoreBonus;

  const tabs: { id: "steps" | "coaching" | "sensory"; label: string }[] = [
    { id: "steps", label: "Steps" },
    { id: "coaching", label: "Coaching" },
    { id: "sensory", label: "Sensory" },
  ];

  return (
    <>
      <div className="px-4 pb-6 space-y-3">
        <div className="flex items-center justify-between">
          <VoicePlayerBar text={narrationText} locale={locale} />
          {rating && <CommunityBadge avg={rating.avg} count={rating.count} />}
        </div>

        {adaptation && adaptation.badges.length > 0 && (
          <SensoryBadge badges={adaptation.badges} warnings={adaptation.warnings} />
        )}

        <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
          <div className="text-gray-900 font-black text-sm mb-2">What this activity builds</div>
          <p className="text-gray-600 text-sm leading-relaxed">{viewingActivity.description}</p>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
          <div className="text-gray-900 font-black text-sm mb-2">Materials</div>
          {(adaptation ? adaptation.adaptedMaterials : viewingActivity.materials).length > 0 ? (
            <div className="flex gap-2 flex-wrap">
              {(adaptation ? adaptation.adaptedMaterials : viewingActivity.materials).map((material) => (
                <span key={material} className="text-xs px-2 py-1 rounded-full bg-violet-50 text-violet-700 font-semibold">
                  {material}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No special materials needed.</p>
          )}
        </section>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                background: activeTab === tab.id ? "white" : "transparent",
                color: activeTab === tab.id ? "#4361EE" : "#9CA3AF",
                boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "steps" && (
          <>
            <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
              <div className="text-gray-900 font-black text-sm mb-2">Step-by-step</div>
              <ol className="space-y-2">
                {(adaptation ? adaptation.adaptedInstructions : viewingActivity.instructions).map((step, idx) => (
                  <li key={`${viewingActivity.id}-step-${idx}`} className="flex items-start gap-2">
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
                    <li key={idea} className="text-gray-700 text-sm leading-relaxed">• {idea}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {viewingActivity.contraindications?.length ? (
              <section className="bg-white rounded-3xl border border-amber-100 p-4 shadow-sm" style={{ background: "#FFFBEF" }}>
                <div className="text-amber-800 font-black text-sm mb-2">Adapt carefully</div>
                <ul className="space-y-2">
                  {viewingActivity.contraindications.map((note) => (
                    <li key={note} className="text-amber-900 text-sm leading-relaxed">• {note}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}

        {activeTab === "coaching" && (
          <div className="space-y-3">
            <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
              <div className="text-gray-900 font-black text-sm mb-2">🗝️ Key Interactions</div>
              <ul className="space-y-1.5">
                {coaching.keyInteractions.map((item, i) => (
                  <li key={i} className="text-gray-600 text-sm flex gap-2"><span className="text-gray-300">•</span><span>{item}</span></li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
              <div className="text-gray-900 font-black text-sm mb-2">🔍 Deepening Tips</div>
              <ul className="space-y-1.5">
                {coaching.deepeningTips.map((item, i) => (
                  <li key={i} className="text-gray-600 text-sm flex gap-2"><span className="text-gray-300">•</span><span>{item}</span></li>
                ))}
              </ul>
            </section>
            <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
              <div className="text-gray-900 font-black text-sm mb-2">👁️ Observe For</div>
              <ul className="space-y-1.5">
                {coaching.observeFor.map((item, i) => (
                  <li key={i} className="text-gray-600 text-sm flex gap-2"><span className="text-gray-300">•</span><span>{item}</span></li>
                ))}
              </ul>
            </section>
            <button
              onClick={() => setShowCoaching(true)}
              className="w-full py-3 rounded-2xl text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#7209B7,#4361EE)" }}
            >
              Open Coaching Timer
            </button>
          </div>
        )}

        {activeTab === "sensory" && (
          <div className="space-y-3">
            {adaptation ? (
              <ModificationPanel adaptation={adaptation} originalInstructions={viewingActivity.instructions} />
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm text-center">
                <p className="text-gray-500 text-sm">No sensory profile configured for this child.</p>
                <p className="text-[10px] text-gray-400 mt-1">Go to Profile → Sensory Settings to set one up.</p>
              </div>
            )}
            <section className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
              <div className="text-gray-900 font-black text-sm mb-2">Curriculum metadata</div>
              <div className="flex gap-2 flex-wrap mb-2">
                {viewingActivity.goalPillars?.map((pillar) => (
                  <span key={pillar} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">{pillar}</span>
                ))}
                {viewingActivity.reviewStatus && (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">{viewingActivity.reviewStatus}</span>
                )}
              </div>
              <div className="text-gray-500 text-xs leading-relaxed">
                Mechanisms: {(viewingActivity.mechanismTags ?? []).join(", ") || "General developmental play"}.
              </div>
            </section>
          </div>
        )}

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
      {showCoaching && <CoachingOverlay guidance={coaching} onClose={() => setShowCoaching(false)} />}
    </>
  );
}

// ============================================================================
// AIHygieneTour
// ----------------------------------------------------------------------------
// Three-screen Family AI-Hygiene playbook (FUTURE_ROADMAP.md §0.5 Phase F).
//
// Surfaced:
//   1. Once on first session (when totalActivities transitions from 0 → 1+)
//   2. Again at the 30-day mark (totalActivities crosses ~30) for the
//      family-norm refresher
//
// Persistence is in localStorage to avoid contaminating the cloud-synced
// app state with a UI toggle. The two milestones each have their own flag
// so the 30-day tour fires even if the user dismissed the first-run tour.
// ============================================================================

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { captureProductEvent } from "../../utils/productAnalytics";

const LS_FIRST_RUN = "neurospark_ai_hygiene_first";
const LS_THIRTY_DAY = "neurospark_ai_hygiene_30d";

const SLIDES: { emoji: string; title: string; body: string; tag: string }[] = [
  {
    emoji: "🎤",
    title: "Visible mic = listening",
    body: "When the mic icon glows, the app is listening. We never store audio by default — voice processes on-device and only the text transcript is sent (and only when needed).",
    tag: "Privacy first",
  },
  {
    emoji: "🤖",
    title: "AI is a tool, not a friend",
    body: "We talk about \"the AI helper\" — never \"your friend\". Children who anthropomorphise AI form attachments that the research on adolescent AI companions tells us we should avoid.",
    tag: "Family norm",
  },
  {
    emoji: "💬",
    title: "The Two-Question Rule",
    body: "Whenever any source — a website, a book, an AI — gives an answer, ask: \"Who told us this? How would they know?\" Make this a household reflex. (Activity a29 in our library.)",
    tag: "Daily habit",
  },
  {
    emoji: "🌙",
    title: "Quiet hours, no AI in the bedroom",
    body: "AI features are paused 22:00–07:00 and we encourage devices to stay out of the bedroom. Sleep is the highest-leverage cognitive intervention for kids.",
    tag: "Boundaries",
  },
];

interface Props {
  totalActivities: number;
}

export function AIHygieneTour({ totalActivities }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [milestone, setMilestone] = useState<"first" | "thirty" | null>(null);

  useEffect(() => {
    if (totalActivities >= 1 && !readFlag(LS_FIRST_RUN)) {
      setMilestone("first");
      setOpen(true);
      return;
    }
    if (totalActivities >= 30 && !readFlag(LS_THIRTY_DAY)) {
      setMilestone("thirty");
      setOpen(true);
      return;
    }
  }, [totalActivities]);

  const close = () => {
    if (milestone === "first") writeFlag(LS_FIRST_RUN);
    if (milestone === "thirty") writeFlag(LS_THIRTY_DAY);
    captureProductEvent("ai_hygiene_tour_complete", { surface: milestone ?? "manual" });
    setOpen(false);
    setStep(0);
    setMilestone(null);
  };

  if (!open) return null;
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  return (
    <div role="dialog" aria-modal="true" aria-label="Family AI Hygiene tour" className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={close} />
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden"
        >
          <div className="p-6 text-center" style={{ background: "linear-gradient(135deg,#EEF1FF,#F5F3FF)" }}>
            <div className="text-5xl mb-2 select-none" aria-hidden="true">{slide.emoji}</div>
            <div className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-white/80 text-slate-500 border border-slate-200 mb-2">
              {slide.tag}
            </div>
            <div className="font-black text-slate-900 text-lg leading-tight">{slide.title}</div>
            <p className="text-slate-600 text-sm mt-2 leading-relaxed">{slide.body}</p>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-center gap-1.5 mb-3">
              {SLIDES.map((_, i) => (
                <span
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === step ? 22 : 6,
                    height: 6,
                    background: i === step ? "#4361EE" : "#E2E8F0",
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={close} className="flex-1 py-3 rounded-2xl font-bold text-slate-500 text-sm bg-slate-100">
                {isLast ? "Done" : "Skip"}
              </button>
              {!isLast && (
                <button
                  onClick={() => setStep((s) => Math.min(SLIDES.length - 1, s + 1))}
                  className="flex-1 py-3 rounded-2xl font-bold text-white text-sm"
                  style={{ background: "linear-gradient(135deg,#4361EE,#7209B7)" }}
                >
                  Next →
                </button>
              )}
              {isLast && (
                <button
                  onClick={close}
                  className="flex-1 py-3 rounded-2xl font-bold text-white text-sm"
                  style={{ background: "linear-gradient(135deg,#06D6A0,#4361EE)" }}
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return true; // pretend done in private mode so we don't loop
  }
}

function writeFlag(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* private mode */
  }
}

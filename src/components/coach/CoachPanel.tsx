import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CoachChat } from "@/components/coach/CoachChat";
import { DailyPlan } from "@/components/coach/DailyPlan";
import {
  generateCoachResponse,
  type CoachChatMessage,
  type CoachChildProfile,
  type CoachResponse,
} from "@/lib/coach/coachEngine";

type Props = {
  open: boolean;
  onClose: () => void;
  profile: CoachChildProfile;
  scores: Record<string, number>;
  isPremium: boolean;
  initialQuestion?: string;
};

function CoachSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

export function CoachPanel({ open, onClose, profile, scores, isPremium, initialQuestion }: Props) {
  const [data, setData] = useState<CoachResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const initialPrompt = useMemo(
    () => initialQuestion || "Give me a practical parenting coach summary based on this brain profile.",
    [initialQuestion],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const response = await generateCoachResponse(profile, scores, {
        isPremium,
        question: initialPrompt,
      });

      if (cancelled) return;
      setData(response);
      setMessages(response.chatReply ? [{ role: "assistant", content: response.chatReply }] : []);
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, profile, scores, isPremium, initialPrompt]);

  async function handleSend(message: string) {
    const nextMessages = [...messages, { role: "user", content: message } satisfies CoachChatMessage];
    setMessages(nextMessages);
    setChatLoading(true);
    setError(null);

    const response = await generateCoachResponse(profile, scores, {
      isPremium,
      question: message,
      messages: nextMessages,
    });

    setData(response);
    setMessages([...nextMessages, { role: "assistant", content: response.chatReply }]);
    setChatLoading(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 28 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="absolute inset-y-2 right-2 z-40 w-[min(23rem,calc(100%-1rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white/98 shadow-2xl backdrop-blur"
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-slate-500">AI Parenting Coach</div>
                  <div className="mt-1 text-lg font-bold text-slate-900">
                    {profile.name ? `${profile.name}'s coach` : "Personalized coach"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500"
                >
                  Close
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Practical parenting guidance shaped by brain-region scores and daily routines.
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {loading && <CoachSkeleton />}

              {!loading && data && (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Summary
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{data.summary}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Strengths to nurture
                    </div>
                    <div className="mt-2 space-y-2">
                      {data.strengths.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Areas to improve
                    </div>
                    <div className="mt-2 space-y-2">
                      {data.improvements.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-2xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Daily plan
                    </div>
                    <div className="mt-2">
                      <DailyPlan items={data.dailyPlan} isPremium={isPremium} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Weekly focus
                    </div>
                    <div className="mt-2 space-y-2">
                      {data.weeklyFocus.map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <CoachChat
                    messages={messages}
                    isPremium={isPremium}
                    loading={chatLoading}
                    onSend={handleSend}
                  />

                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] leading-relaxed text-blue-900">
                    {data.disclaimer}
                  </div>
                </>
              )}

              {!loading && error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {error}
                </div>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

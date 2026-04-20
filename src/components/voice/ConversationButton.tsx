// ============================================================================
// ConversationButton
// ----------------------------------------------------------------------------
// Tap-and-converse button that drives a VoiceSession (FUTURE_ROADMAP.md §1).
// Visual states match the FSM (idle → listen → think → speak → error).
//
// The actual LLM call is delegated to `onTurn`; this lets the parent route
// to OpenAI today and to /voice/turn (Edge Function with SSE) tomorrow.
// ============================================================================

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useVoiceSession } from "../../lib/voice/useVoiceSession";
import type { VoiceAgent } from "../../lib/voice/voiceAdapter";

interface Props {
  agent: VoiceAgent;
  locale: string;
  onTurn: (utterance: string) => Promise<string>;
  label?: string;
}

const STATE_UI: Record<string, { color: string; ring: string; emoji: string; hint: string }> = {
  idle:   { color: "#4361EE", ring: "rgba(67,97,238,0.20)",  emoji: "🎙️",  hint: "Tap to talk" },
  listen: { color: "#06D6A0", ring: "rgba(6,214,160,0.30)",  emoji: "👂",  hint: "Listening…" },
  think:  { color: "#F59E0B", ring: "rgba(245,158,11,0.30)", emoji: "💭",  hint: "Thinking…" },
  speak:  { color: "#7209B7", ring: "rgba(114,9,183,0.30)",  emoji: "🗣️",  hint: "Speaking — tap to interrupt" },
  error:  { color: "#DC2626", ring: "rgba(220,38,38,0.30)",  emoji: "⚠️",  hint: "Couldn't hear that" },
};

export function ConversationButton({ agent, locale, onTurn, label }: Props) {
  const { state, transcript, start, cancel, bargeIn, capabilities } = useVoiceSession({ agent, locale, onTurn });

  if (!capabilities.tts || !capabilities.stt) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Voice conversation needs a browser/device with both speech synthesis and microphone permissions.
      </div>
    );
  }

  const ui = STATE_UI[state];

  const handleTap = () => {
    if (state === "idle") void start();
    else if (state === "speak") bargeIn();
    else cancel();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        onClick={handleTap}
        whileTap={{ scale: 0.94 }}
        aria-label={label ?? "Tap to talk"}
        className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg select-none"
        style={{ background: ui.color }}
      >
        <AnimatePresence>
          {(state === "listen" || state === "speak") && (
            <motion.div
              key="ring"
              className="absolute inset-0 rounded-full"
              style={{ background: ui.ring }}
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
            />
          )}
        </AnimatePresence>
        <span className="relative text-3xl" aria-hidden="true">{ui.emoji}</span>
      </motion.button>
      <div className="text-xs font-bold" style={{ color: ui.color }}>{ui.hint}</div>
      {transcript && (
        <div className="max-w-[260px] rounded-xl bg-slate-100 px-3 py-1.5 text-xs text-slate-600 text-center" aria-live="polite">
          “{transcript}”
        </div>
      )}
    </div>
  );
}

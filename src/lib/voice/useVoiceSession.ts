// ============================================================================
// useVoiceSession — React hook around VoiceSession
// ----------------------------------------------------------------------------
// Picks the platform adapter (web today, native plugin if installed) and
// exposes ergonomic state + handlers for components like ConversationButton.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { pickAdapter } from "./nativeVoiceAdapter";
import { VoiceSession, type VoiceState, type VoiceTurn } from "./voiceSession";
import type { VoiceAgent } from "./voiceAdapter";

export interface UseVoiceSessionArgs {
  agent: VoiceAgent;
  locale: string;
  onTurn: (utterance: string) => Promise<string>;
}

export interface UseVoiceSessionResult {
  state: VoiceState;
  transcript: string;
  turns: VoiceTurn[];
  start: () => Promise<void>;
  cancel: () => void;
  bargeIn: () => void;
  capabilities: ReturnType<ReturnType<typeof pickAdapter>["capabilities"]>;
}

export function useVoiceSession(args: UseVoiceSessionArgs): UseVoiceSessionResult {
  const adapter = useMemo(() => pickAdapter(), []);
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const sessionRef = useRef<VoiceSession | null>(null);

  useEffect(() => {
    const s = new VoiceSession({
      adapter,
      agent: args.agent,
      locale: args.locale,
      onTurn: args.onTurn,
      onStateChange: (next, t) => {
        setState(next);
        if (typeof t === "string") setTranscript(t);
      },
      onTurnComplete: (turn) => setTurns((prev) => [...prev, turn]),
    });
    sessionRef.current = s;
    return () => {
      s.cancel();
      sessionRef.current = null;
    };
  }, [adapter, args.agent, args.locale, args.onTurn]);

  return {
    state,
    transcript,
    turns,
    start: async () => sessionRef.current?.start() ?? Promise.resolve(),
    cancel: () => sessionRef.current?.cancel(),
    bargeIn: () => sessionRef.current?.bargeIn(),
    capabilities: adapter.capabilities(),
  };
}

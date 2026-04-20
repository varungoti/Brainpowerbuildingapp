// ============================================================================
// VoiceAdapter contracts (FUTURE_ROADMAP.md §1 Conversational Voice Plan)
// ----------------------------------------------------------------------------
// Single contract that has 3 implementations behind it:
//   • web (Web Speech API)               — built-in, ships today
//   • ios (AVSpeechSynth + SFSpeech)     — Capacitor plugin, deferred
//   • android (TextToSpeech + Speech)    — Capacitor plugin, deferred
//
// The adapter exposes only TTS + STT primitives. The conversation FSM lives
// in voiceSession.ts and consumes whatever adapter the platform picks.
// ============================================================================

export type VoiceAgent = "coach" | "counselor" | "narrator";
export type VoiceLocale = string;

export interface TTSOptions {
  text: string;
  locale?: VoiceLocale;
  rate?: number;
  pitch?: number;
  agent?: VoiceAgent;
  onBoundary?: (charIndex: number) => void;
  onEnd?: () => void;
  onError?: (e: Error) => void;
}

export interface STTOptions {
  locale?: VoiceLocale;
  partialResults?: boolean;
  /** Stop listening after this many ms of silence. */
  silenceTimeoutMs?: number;
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (e: Error) => void;
}

export interface VoiceCapabilities {
  /** Whether on-device TTS is available. */
  tts: boolean;
  /** Whether on-device STT is available without network. */
  stt: boolean;
  /** Whether the platform supports interruption mid-utterance. */
  bargeIn: boolean;
  /** Best-known wake-word implementation, if any. */
  wakeWord: "none" | "porcupine" | "platform";
  /** Best-known platform identifier. */
  platform: "web" | "ios" | "android" | "unknown";
}

export interface VoiceAdapter {
  capabilities(): VoiceCapabilities;
  speak(opts: TTSOptions): Promise<void>;
  cancelSpeech(): void;
  startListening(opts: STTOptions): Promise<void>;
  stopListening(): void;
  isListening(): boolean;
  isSpeaking(): boolean;
}

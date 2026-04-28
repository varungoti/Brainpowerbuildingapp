// ============================================================================
// VoiceSession — Finite State Machine for conversational turns
// ----------------------------------------------------------------------------
// States:
//   idle    → user can tap to start
//   listen  → STT capturing utterance
//   think   → LLM call in flight
//   speak   → TTS streaming reply
//   error   → recoverable failure (auto-resets after timeout)
//
// Transitions are triggered by user input + adapter callbacks; the session
// notifies subscribers on every state change so React hooks can re-render.
// ============================================================================

import { captureProductEvent } from "../../utils/productAnalytics";
import type { VoiceAdapter, VoiceAgent } from "./voiceAdapter";
import { normalizeSpeechLocale } from "./speechLocale";

function voiceErrorMessage(raw: string): string {
  const key = raw.trim();
  const map: Record<string, string> = {
    stt_language_not_supported:
      "Voice typing doesn't support that language code on your device. Try again — we now pick a supported dialect (e.g. English US).",
    stt_language_unavailable:
      "Speech for this language isn't ready on your device. Add it in system language & speech settings, or try English.",
    tts_language_unavailable:
      "No voice is installed for this language. Add one in accessibility / text-to-speech settings.",
    tts_not_ready: "Text-to-speech is still warming up. Try again in a moment.",
    tts_speak_failed: "Couldn't play the spoken reply. Check your volume and try again.",
    tts_error: "Couldn't play the spoken reply. Check your volume and try again.",
    audio_session: "The microphone is in use by another app. Close it and try again.",
    speech_recognition_permission_denied:
      "Microphone or speech recognition is turned off. Enable them in Settings to use voice.",
    stt_unavailable: "Speech recognition isn't available on this device.",
    stt_error_client: "The voice service was busy. Tap the mic to try again.",
    stt_error_audio: "We couldn't record from the microphone. Check it's not muted, then try again.",
    stt_error_network: "Voice typing needs an internet connection for this language. Try again when you're online.",
    stt_error_network_timeout: "Voice typing timed out reaching the network. Try again in a moment.",
    stt_error_server: "The voice service hit a server hiccup. Tap the mic to try again.",
    stt_server_disconnected: "The voice service dropped the connection. Tap the mic to try again.",
    stt_start_failed: "Couldn't start the microphone. Tap the mic to try again.",
    stt_busy: "Voice service was busy. Wait a moment and tap the mic again.",
    stt_no_match: "No speech was detected. Tap the mic and speak a bit closer.",
    stt_speech_timeout: "We didn't hear anything. Tap the mic and try again.",
    stt_failed_after_retry: "Voice input still isn't working. Check microphone access in Settings, then try again.",
  };
  if (map[key]) return map[key];
  if (key.startsWith("stt_error_")) return "Voice input hit a system hiccup. Tap the mic to try again.";
  if (key.startsWith("tts_")) return "Voice playback hit an issue. Tap the mic to try again.";
  return raw;
}

/** Hard cap on a single listen turn, in case the native plugin never delivers a final/error event. */
const LISTEN_WATCHDOG_MS = 15_000;

export type VoiceState = "idle" | "listen" | "think" | "speak" | "error";

export interface VoiceTurn {
  user: string;
  assistant: string;
  ts: string;
}

export interface VoiceSessionOptions {
  adapter: VoiceAdapter;
  agent: VoiceAgent;
  locale: string;
  /** Async function that fetches the assistant reply; returns the streamed text. */
  onTurn: (utterance: string) => Promise<string>;
  /** Called whenever state changes for UI binding. */
  onStateChange?: (state: VoiceState, transcript?: string) => void;
  /** Called when the assistant produces a final reply. */
  onTurnComplete?: (turn: VoiceTurn) => void;
}

export class VoiceSession {
  private state: VoiceState = "idle";
  private currentTranscript = "";
  private turns: VoiceTurn[] = [];
  private startTs = 0;
  private listenWatchdog: ReturnType<typeof setTimeout> | null = null;

  constructor(private opts: VoiceSessionOptions) {}

  private armListenWatchdog(): void {
    this.clearListenWatchdog();
    this.listenWatchdog = setTimeout(() => {
      this.listenWatchdog = null;
      if (this.state !== "listen") return;
      try {
        this.opts.adapter.stopListening();
      } catch {
        /* ignore */
      }
      const partial = this.currentTranscript.trim();
      if (partial.length > 0) {
        // Treat the partial as a final so the user's effort isn't lost.
        void this.handleFinal(partial);
      } else {
        this.handleError(new Error("stt_speech_timeout"));
      }
    }, LISTEN_WATCHDOG_MS);
  }

  private clearListenWatchdog(): void {
    if (this.listenWatchdog) {
      clearTimeout(this.listenWatchdog);
      this.listenWatchdog = null;
    }
  }

  getState(): VoiceState {
    return this.state;
  }

  getTranscript(): string {
    return this.currentTranscript;
  }

  getTurns(): VoiceTurn[] {
    return [...this.turns];
  }

  private setState(next: VoiceState, transcript?: string) {
    this.state = next;
    if (transcript !== undefined) this.currentTranscript = transcript;
    this.opts.onStateChange?.(next, this.currentTranscript);
  }

  async start(): Promise<void> {
    if (this.state !== "idle") return;
    this.startTs = Date.now();
    captureProductEvent("voice_session_start", {
      voice_agent: this.opts.agent,
      voice_locale: this.opts.locale,
    });
    this.setState("listen", "");
    this.armListenWatchdog();

    try {
      await this.opts.adapter.startListening({
        locale: normalizeSpeechLocale(this.opts.locale),
        partialResults: true,
        silenceTimeoutMs: 2200,
        onPartial: (t) => {
          if (this.state === "listen") {
            this.setState("listen", t);
            // Each partial proves the recognizer is alive — refresh the watchdog.
            this.armListenWatchdog();
          }
        },
        onFinal: (t) => {
          this.clearListenWatchdog();
          this.handleFinal(t);
        },
        onError: (e) => {
          this.clearListenWatchdog();
          this.handleError(e);
        },
      });
    } catch (e) {
      this.clearListenWatchdog();
      this.handleError(e as Error);
    }
  }

  /** User taps to interrupt during speak — barge-in. */
  bargeIn(): void {
    if (this.state === "speak") {
      this.opts.adapter.cancelSpeech();
      this.setState("idle");
    }
  }

  /** User taps to abort whatever's happening. */
  cancel(): void {
    this.clearListenWatchdog();
    this.opts.adapter.cancelSpeech();
    this.opts.adapter.stopListening();
    captureProductEvent("voice_session_complete", {
      voice_agent: this.opts.agent,
      voice_locale: this.opts.locale,
      voice_duration_ms: Date.now() - this.startTs,
      fail_reason: "user_cancel",
    });
    this.setState("idle", "");
  }

  private async handleFinal(text: string) {
    if (this.state === "error") return;
    if (!text || text.trim().length === 0) {
      this.setState("idle", "");
      return;
    }
    this.setState("think", text);

    try {
      const reply = await this.opts.onTurn(text);
      const turn: VoiceTurn = { user: text, assistant: reply, ts: new Date().toISOString() };
      this.turns.push(turn);
      this.opts.onTurnComplete?.(turn);

      this.setState("speak");
      await this.opts.adapter.speak({
        text: reply,
        locale: this.opts.locale,
        agent: this.opts.agent,
        onEnd: () => {
          if (this.state === "speak") {
            captureProductEvent("voice_session_complete", {
              voice_agent: this.opts.agent,
              voice_locale: this.opts.locale,
              voice_duration_ms: Date.now() - this.startTs,
              voice_transcript_chars: text.length + reply.length,
            });
            this.setState("idle", "");
          }
        },
        onError: (e) => this.handleError(e),
      });
    } catch (e) {
      this.handleError(e as Error);
    }
  }

  private handleError(e: Error): void {
    captureProductEvent("voice_session_error", {
      voice_agent: this.opts.agent,
      voice_locale: this.opts.locale,
      fail_reason: e.message?.slice(0, 60) || "unknown",
    });
    this.setState("error", voiceErrorMessage(e.message ?? ""));
    setTimeout(() => {
      if (this.state === "error") this.setState("idle", "");
    }, 2400);
  }
}

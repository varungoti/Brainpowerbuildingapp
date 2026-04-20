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

  constructor(private opts: VoiceSessionOptions) {}

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

    try {
      await this.opts.adapter.startListening({
        locale: this.opts.locale,
        partialResults: true,
        silenceTimeoutMs: 2200,
        onPartial: (t) => {
          if (this.state === "listen") this.setState("listen", t);
        },
        onFinal: (t) => this.handleFinal(t),
        onError: (e) => this.handleError(e),
      });
    } catch (e) {
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
    this.setState("error", e.message);
    setTimeout(() => {
      if (this.state === "error") this.setState("idle", "");
    }, 2400);
  }
}

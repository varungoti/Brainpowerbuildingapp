// ============================================================================
// Web VoiceAdapter — Web Speech API implementation
// ----------------------------------------------------------------------------
// • TTS: SpeechSynthesisUtterance
// • STT: webkitSpeechRecognition / SpeechRecognition (Chrome / Edge / Safari)
//
// This adapter is the fallback that ships in browsers and inside the WebView
// before the native Capacitor plugin is wired in.
// ============================================================================

import type { STTOptions, TTSOptions, VoiceAdapter, VoiceCapabilities } from "./voiceAdapter";
import { getSpeechLang } from "./voiceNarrator";

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export class WebVoiceAdapter implements VoiceAdapter {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentRecognition: SpeechRecognitionLike | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;

  capabilities(): VoiceCapabilities {
    const hasSynth = typeof window !== "undefined" && "speechSynthesis" in window;
    const hasReco = !!getSpeechRecognitionCtor();
    return {
      tts: hasSynth,
      stt: hasReco,
      // Most browser TTS engines support cancel, but they suspend rather than truly barge-in.
      bargeIn: hasSynth,
      wakeWord: "none",
      platform: "web",
    };
  }

  async speak(opts: TTSOptions): Promise<void> {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      opts.onError?.(new Error("speechSynthesis not available"));
      return;
    }
    this.cancelSpeech();
    return new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(opts.text);
      const lang = opts.locale ? getSpeechLang(opts.locale) : "en-US";
      u.lang = lang;
      u.rate = opts.rate ?? 0.95;
      u.pitch = opts.pitch ?? 1.0;
      const matched = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith(lang.split("-")[0]));
      if (matched.length > 0) u.voice = matched[0];

      u.onboundary = (ev) => opts.onBoundary?.(ev.charIndex);
      u.onend = () => {
        this.currentUtterance = null;
        opts.onEnd?.();
        resolve();
      };
      u.onerror = (ev) => {
        this.currentUtterance = null;
        opts.onError?.(new Error(ev.error || "tts error"));
        resolve();
      };
      this.currentUtterance = u;
      window.speechSynthesis.speak(u);
    });
  }

  cancelSpeech(): void {
    if (typeof window === "undefined") return;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    this.currentUtterance = null;
  }

  async startListening(opts: STTOptions): Promise<void> {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      opts.onError?.(new Error("SpeechRecognition not available"));
      return;
    }
    this.stopListening();
    const r = new Ctor();
    r.lang = opts.locale ? getSpeechLang(opts.locale) : "en-US";
    r.interimResults = !!opts.partialResults;
    r.continuous = false;

    const armSilenceTimer = () => {
      if (this.silenceTimer) clearTimeout(this.silenceTimer);
      const ms = opts.silenceTimeoutMs ?? 2200;
      this.silenceTimer = setTimeout(() => this.stopListening(), ms);
    };

    r.onresult = (ev) => {
      armSilenceTimer();
      let finalText = "";
      let partialText = "";
      for (let i = 0; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else partialText += res[0].transcript;
      }
      if (partialText) opts.onPartial?.(partialText.trim());
      if (finalText) opts.onFinal?.(finalText.trim());
    };
    r.onerror = (ev) => opts.onError?.(new Error(ev.error || "stt error"));
    r.onend = () => {
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
      this.currentRecognition = null;
    };

    this.currentRecognition = r;
    try {
      r.start();
      armSilenceTimer();
    } catch (e) {
      opts.onError?.(e as Error);
    }
  }

  stopListening(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    try {
      this.currentRecognition?.stop();
    } catch {
      /* ignore */
    }
    this.currentRecognition = null;
  }

  isListening(): boolean {
    return this.currentRecognition != null;
  }

  isSpeaking(): boolean {
    if (typeof window === "undefined") return false;
    return "speechSynthesis" in window && window.speechSynthesis.speaking;
  }
}

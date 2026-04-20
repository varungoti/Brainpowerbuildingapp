// ============================================================================
// Native VoiceAdapter — Capacitor plugin contracts (iOS / Android)
// ----------------------------------------------------------------------------
// `pickAdapter()` returns the strongest adapter available at runtime, in
// priority order:
//
//   1. In-house NeuroSparkVoice (planned, full-stack TTS + STT + barge-in)
//   2. @capacitor-community/text-to-speech + @capacitor-community/speech-
//      recognition — community plugins recommended by FUTURE_ROADMAP §2.4.
//      Either or both may be present; whichever side is missing falls back
//      to WebVoiceAdapter for that primitive.
//   3. WebVoiceAdapter (Web Speech API) — always-available fallback.
//
// Plugin discovery is purely synchronous — Capacitor self-registers each
// plugin on `window.Capacitor.Plugins.<Name>` at boot, so we don't need
// dynamic imports.
// ============================================================================

import type {
  STTOptions,
  TTSOptions,
  VoiceAdapter,
  VoiceCapabilities,
} from "./voiceAdapter";
import { WebVoiceAdapter } from "./webVoiceAdapter";

// ─── In-house full-stack plugin (deferred) ────────────────────────────────

interface NeuroSparkVoicePlugin {
  capabilities(): Promise<VoiceCapabilities>;
  speak(opts: TTSOptions): Promise<void>;
  cancelSpeech(): Promise<void>;
  startListening(opts: STTOptions): Promise<void>;
  stopListening(): Promise<void>;
  isListening(): Promise<{ value: boolean }>;
  isSpeaking(): Promise<{ value: boolean }>;
}

// ─── Community plugin shapes (only the bits we actually call) ─────────────
// Reference: capacitor-community/text-to-speech README, v4.x
interface CommunityTTS {
  speak(opts: { text: string; lang?: string; rate?: number; pitch?: number; volume?: number; voice?: number; category?: string }): Promise<void>;
  stop(): Promise<void>;
}

// Reference: capacitor-community/speech-recognition README, v6.x
interface SpeechListenerHandle { remove(): Promise<void> }
interface CommunitySTT {
  available(): Promise<{ available: boolean }>;
  checkPermissions?(): Promise<{ speechRecognition: string }>;
  requestPermissions?(): Promise<{ speechRecognition: string }>;
  start(opts: { language?: string; partialResults?: boolean; popup?: boolean; maxResults?: number }): Promise<{ matches?: string[] }>;
  stop(): Promise<void>;
  addListener(
    event: "partialResults" | "listeningState",
    cb: (data: { matches?: string[]; status?: "started" | "stopped" }) => void,
  ): Promise<SpeechListenerHandle> | SpeechListenerHandle;
}

interface CapacitorBridge {
  isNativePlatform?: () => boolean;
  getPlatform?: () => "web" | "ios" | "android";
  Plugins?: {
    NeuroSparkVoice?: NeuroSparkVoicePlugin;
    TextToSpeech?: CommunityTTS;
    SpeechRecognition?: CommunitySTT;
  };
}

function getCap(): CapacitorBridge | null {
  const w = (typeof window !== "undefined" ? (window as unknown as { Capacitor?: CapacitorBridge }) : null);
  return w?.Capacitor ?? null;
}

// ─── Adapter implementations ──────────────────────────────────────────────

class NativePluginAdapter implements VoiceAdapter {
  constructor(private plugin: NeuroSparkVoicePlugin, private platform: "ios" | "android") {}

  capabilities(): VoiceCapabilities {
    return {
      tts: true,
      stt: true,
      bargeIn: true,
      wakeWord: this.platform === "ios" ? "platform" : "porcupine",
      platform: this.platform,
    };
  }

  async speak(opts: TTSOptions): Promise<void> {
    await this.plugin.speak(opts);
    opts.onEnd?.();
  }

  cancelSpeech(): void {
    void this.plugin.cancelSpeech().catch(() => undefined);
  }

  async startListening(opts: STTOptions): Promise<void> {
    await this.plugin.startListening(opts);
  }

  stopListening(): void {
    void this.plugin.stopListening().catch(() => undefined);
  }

  isListening(): boolean { return false; }
  isSpeaking(): boolean { return false; }
}

/**
 * Composite adapter that uses community plugins for whichever primitive(s)
 * are available, delegating the rest to WebVoiceAdapter. This is what most
 * production builds will use until the in-house NeuroSparkVoice plugin lands.
 */
class CommunityPluginAdapter implements VoiceAdapter {
  private webFallback: WebVoiceAdapter;
  private speakingNow = false;
  private listeningNow = false;
  private partialHandle: SpeechListenerHandle | null = null;

  constructor(
    private tts: CommunityTTS | null,
    private stt: CommunitySTT | null,
    private platform: "ios" | "android" | "web",
  ) {
    this.webFallback = new WebVoiceAdapter();
  }

  capabilities(): VoiceCapabilities {
    const webCaps = this.webFallback.capabilities();
    return {
      tts: this.tts != null || webCaps.tts,
      stt: this.stt != null || webCaps.stt,
      bargeIn: true, // we can always cancel TTS before starting STT
      wakeWord: "none",
      platform: this.platform === "web" ? webCaps.platform : this.platform,
    };
  }

  async speak(opts: TTSOptions): Promise<void> {
    if (!this.tts) return this.webFallback.speak(opts);
    this.speakingNow = true;
    try {
      await this.tts.speak({
        text: opts.text,
        lang: opts.locale,
        rate: opts.rate,
        pitch: opts.pitch,
      });
      opts.onEnd?.();
    } catch (e) {
      opts.onError?.(e instanceof Error ? e : new Error(String(e)));
    } finally {
      this.speakingNow = false;
    }
  }

  cancelSpeech(): void {
    if (this.tts) {
      this.speakingNow = false;
      void this.tts.stop().catch(() => undefined);
      return;
    }
    this.webFallback.cancelSpeech();
  }

  async startListening(opts: STTOptions): Promise<void> {
    if (!this.stt) return this.webFallback.startListening(opts);

    // Permission + availability checks before starting.
    try {
      const avail = await this.stt.available();
      if (!avail.available) {
        opts.onError?.(new Error("speech_recognition_unavailable"));
        return;
      }
      if (this.stt.checkPermissions && this.stt.requestPermissions) {
        const cur = await this.stt.checkPermissions();
        if (cur.speechRecognition !== "granted") {
          const req = await this.stt.requestPermissions();
          if (req.speechRecognition !== "granted") {
            opts.onError?.(new Error("speech_recognition_permission_denied"));
            return;
          }
        }
      }
    } catch (e) {
      opts.onError?.(e instanceof Error ? e : new Error(String(e)));
      return;
    }

    if (opts.partialResults && opts.onPartial) {
      try {
        const handle = await this.stt.addListener("partialResults", (data) => {
          const text = data.matches?.[0];
          if (text) opts.onPartial?.(text);
        });
        this.partialHandle = handle;
      } catch {
        // Listener registration is best-effort; final results still flow.
      }
    }

    this.listeningNow = true;
    try {
      const result = await this.stt.start({
        language: opts.locale,
        partialResults: opts.partialResults ?? true,
        popup: false,
      });
      const finalText = result.matches?.[0] ?? "";
      if (finalText) opts.onFinal?.(finalText);
    } catch (e) {
      opts.onError?.(e instanceof Error ? e : new Error(String(e)));
    } finally {
      this.listeningNow = false;
      if (this.partialHandle) {
        void this.partialHandle.remove().catch(() => undefined);
        this.partialHandle = null;
      }
    }
  }

  stopListening(): void {
    if (!this.stt) {
      this.webFallback.stopListening();
      return;
    }
    this.listeningNow = false;
    void this.stt.stop().catch(() => undefined);
    if (this.partialHandle) {
      void this.partialHandle.remove().catch(() => undefined);
      this.partialHandle = null;
    }
  }

  isListening(): boolean { return this.listeningNow || this.webFallback.isListening(); }
  isSpeaking(): boolean { return this.speakingNow || this.webFallback.isSpeaking(); }
}

let cachedAdapter: VoiceAdapter | null = null;

export function pickAdapter(): VoiceAdapter {
  if (cachedAdapter) return cachedAdapter;
  const cap = getCap();
  const isNative = cap?.isNativePlatform?.() === true;
  const rawPlatform = cap?.getPlatform?.() ?? "web";
  const platform: "ios" | "android" | "web" =
    rawPlatform === "ios" || rawPlatform === "android" ? rawPlatform : "web";
  const plugins = cap?.Plugins;

  // 1) Full-stack in-house plugin wins outright.
  if (isNative && plugins?.NeuroSparkVoice && (platform === "ios" || platform === "android")) {
    cachedAdapter = new NativePluginAdapter(plugins.NeuroSparkVoice, platform);
    return cachedAdapter;
  }

  // 2) Community plugins — either or both. Skip on plain web platforms
  //    where they can't be installed (the WebVoiceAdapter is a better
  //    fit there since it doesn't pretend to be native).
  const tts = isNative ? plugins?.TextToSpeech ?? null : null;
  const stt = isNative ? plugins?.SpeechRecognition ?? null : null;
  if (tts || stt) {
    cachedAdapter = new CommunityPluginAdapter(tts, stt, platform);
    return cachedAdapter;
  }

  // 3) Fallback.
  cachedAdapter = new WebVoiceAdapter();
  return cachedAdapter;
}

/** Test helper to clear the cached adapter between unit tests. */
export function __resetVoiceAdapterForTests(): void {
  cachedAdapter = null;
}

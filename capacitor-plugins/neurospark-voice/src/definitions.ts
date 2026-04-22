import type { Plugin } from "@capacitor/core";

/** Batched capability payload (matches `VoiceCapabilities` in app, but JSON-friendly). */
export interface VoiceCapabilitiesResponse {
  tts: boolean;
  stt: boolean;
  bargeIn: boolean;
  wakeWord: "none" | "porcupine" | "platform";
  platform: "web" | "ios" | "android" | "unknown";
}

export interface SpeakOptions {
  text: string;
  locale?: string;
  rate?: number;
  pitch?: number;
  /** Coach / counselor / narrator — for future voice tuning. */
  agent?: "coach" | "counselor" | "narrator";
}

/**
 * STT start params only — no callbacks (they cannot cross the native bridge).
 * Partial/final/error stream via:
 *  - `sttPartial` { text }
 *  - `sttFinal`   { text }
 *  - `sttError`   { error }
 */
export interface StartListeningOptions {
  locale?: string;
  partialResults?: boolean;
  silenceTimeoutMs?: number;
}

export type NeurosparkVoiceEvent = "sttPartial" | "sttFinal" | "sttError";

/** Microphone + speech recognition permission (mirrors community SpeechRecognition plugin shape). */
export type SpeechRecognitionPermissionValue = "granted" | "denied" | "prompt";

export interface SpeechRecognitionPermissionStatus {
  speechRecognition: SpeechRecognitionPermissionValue;
}

/**
 * Wire STT streaming with `addListener("sttPartial" | "sttFinal" | "sttError", ...)`
 * after `startListening` — see `NativePluginAdapter` in the app.
 */
export interface NeurosparkVoicePlugin extends Plugin {
  /**
   * Returns platform capabilities. Native should report real availability once
   * AVSpeech* / SFSpeech* (iOS) and TextToSpeech+Speech (Android) are wired.
   */
  capabilities(): Promise<VoiceCapabilitiesResponse>;
  checkPermissions(): Promise<SpeechRecognitionPermissionStatus>;
  requestPermissions(): Promise<SpeechRecognitionPermissionStatus>;
  /** Speak text. Promise resolves when playback finishes (or is cancelled). */
  speak(options: SpeakOptions): Promise<void>;
  cancelSpeech(): Promise<void>;
  startListening(options: StartListeningOptions): Promise<void>;
  stopListening(): Promise<void>;
  isListening(): Promise<{ value: boolean }>;
  isSpeaking(): Promise<{ value: boolean }>;
}

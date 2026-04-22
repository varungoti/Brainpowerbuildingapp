import { WebPlugin } from "@capacitor/core";
import type { NeurosparkVoicePlugin } from "./definitions";

/**
 * Browser / dev: no native audio path. Methods no-op or reject so we never
 * masquerade as native. The app uses `pickAdapter()` → `WebVoiceAdapter` on web.
 */
export class NeurosparkVoiceWeb extends WebPlugin implements NeurosparkVoicePlugin {
  async capabilities(): Promise<import("./definitions").VoiceCapabilitiesResponse> {
    return {
      tts: false,
      stt: false,
      bargeIn: false,
      wakeWord: "none",
      platform: "web",
    };
  }

  async checkPermissions(): Promise<import("./definitions").SpeechRecognitionPermissionStatus> {
    return { speechRecognition: "denied" };
  }

  async requestPermissions(): Promise<import("./definitions").SpeechRecognitionPermissionStatus> {
    return { speechRecognition: "denied" };
  }

  async speak(): Promise<void> {
    throw this.unimplemented("NeuroSparkVoice.speak is native-only");
  }

  async cancelSpeech(): Promise<void> {
    /* no-op */
  }

  async startListening(): Promise<void> {
    throw this.unimplemented("NeuroSparkVoice.startListening is native-only");
  }

  async stopListening(): Promise<void> {
    /* no-op */
  }

  async isListening(): Promise<{ value: boolean }> {
    return { value: false };
  }

  async isSpeaking(): Promise<{ value: boolean }> {
    return { value: false };
  }
}

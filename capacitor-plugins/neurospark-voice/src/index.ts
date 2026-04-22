import { registerPlugin } from "@capacitor/core";
import type { NeurosparkVoicePlugin } from "./definitions";

export type {
  NeurosparkVoicePlugin,
  SpeakOptions,
  StartListeningOptions,
  VoiceCapabilitiesResponse,
  NeurosparkVoiceEvent,
  SpeechRecognitionPermissionStatus,
  SpeechRecognitionPermissionValue,
} from "./definitions";

export { NeurosparkVoiceWeb } from "./web";

/**
 * Registered as `NeuroSparkVoice` so `window.Capacitor.Plugins.NeuroSparkVoice`
 * matches `src/lib/voice/nativeVoiceAdapter.ts`.
 */
export const NeuroSparkVoice = registerPlugin<NeurosparkVoicePlugin>("NeuroSparkVoice", {
  web: () => import("./web").then((m) => new m.NeurosparkVoiceWeb()),
});

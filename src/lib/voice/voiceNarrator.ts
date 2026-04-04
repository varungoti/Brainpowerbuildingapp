export interface VoiceNarrationOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  onEnd?: () => void;
  onError?: (e: Error) => void;
}

let _currentUtterance: SpeechSynthesisUtterance | null = null;

export function isVoiceAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function getVoicesForLang(lang: string): SpeechSynthesisVoice[] {
  if (!isVoiceAvailable()) return [];
  return speechSynthesis.getVoices().filter(v => v.lang.startsWith(lang));
}

export function speak(text: string, options: VoiceNarrationOptions = {}): boolean {
  if (!isVoiceAvailable()) {
    options.onError?.(new Error("Speech synthesis not available"));
    return false;
  }

  stop();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = options.rate ?? 0.9;
  u.pitch = options.pitch ?? 1.0;
  u.lang = options.lang ?? "en-US";

  const voices = getVoicesForLang(u.lang);
  if (voices.length > 0) u.voice = voices[0];

  u.onend = () => {
    _currentUtterance = null;
    options.onEnd?.();
  };
  u.onerror = (e) => {
    _currentUtterance = null;
    options.onError?.(new Error(e.error));
  };

  _currentUtterance = u;
  speechSynthesis.speak(u);
  return true;
}

export function stop(): void {
  if (!isVoiceAvailable()) return;
  speechSynthesis.cancel();
  _currentUtterance = null;
}

export function isSpeaking(): boolean {
  if (!isVoiceAvailable()) return false;
  return speechSynthesis.speaking;
}

const LOCALE_TO_SPEECH_LANG: Record<string, string> = {
  en: "en-US", hi: "hi-IN", ta: "ta-IN", "zh-CN": "zh-CN", ko: "ko-KR",
  es: "es-ES", ar: "ar-SA", bn: "bn-IN", pt: "pt-BR", fr: "fr-FR", sw: "sw-KE",
  te: "te-IN", kn: "kn-IN", ml: "ml-IN", mr: "mr-IN", gu: "gu-IN", pa: "pa-IN", ja: "ja-JP",
};

export function getSpeechLang(locale: string): string {
  return LOCALE_TO_SPEECH_LANG[locale] ?? "en-US";
}

// @vitest-environment jsdom
// ============================================================================
// Tests for pickAdapter() — covers the priority order:
//   NeuroSparkVoice (full-stack) > community plugins > WebVoiceAdapter.
// Runs in jsdom so we can attach a fake `window.Capacitor` to drive the
// branch logic.
// ============================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { __resetVoiceAdapterForTests, pickAdapter } from "./nativeVoiceAdapter";
import { WebVoiceAdapter } from "./webVoiceAdapter";

type CapMock = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => "web" | "ios" | "android";
  Plugins?: {
    NeuroSparkVoice?: unknown;
    TextToSpeech?: unknown;
    SpeechRecognition?: unknown;
  };
};

function setCapacitor(cap: CapMock | null): void {
  const w = window as unknown as { Capacitor?: CapMock };
  if (cap) w.Capacitor = cap;
  else delete w.Capacitor;
}

describe("pickAdapter", () => {
  beforeEach(() => {
    __resetVoiceAdapterForTests();
    setCapacitor(null);
  });

  afterEach(() => {
    __resetVoiceAdapterForTests();
    setCapacitor(null);
  });

  it("returns WebVoiceAdapter when Capacitor is absent", () => {
    const adapter = pickAdapter();
    expect(adapter).toBeInstanceOf(WebVoiceAdapter);
  });

  it("returns WebVoiceAdapter on Capacitor web platform with no plugins", () => {
    setCapacitor({
      isNativePlatform: () => false,
      getPlatform: () => "web",
      Plugins: {},
    });
    const adapter = pickAdapter();
    expect(adapter).toBeInstanceOf(WebVoiceAdapter);
  });

  it("ignores community plugins when running as web (Capacitor would not load them)", () => {
    setCapacitor({
      isNativePlatform: () => false,
      getPlatform: () => "web",
      Plugins: {
        TextToSpeech: { speak: vi.fn(), stop: vi.fn() },
        SpeechRecognition: { available: vi.fn() },
      },
    });
    const adapter = pickAdapter();
    expect(adapter).toBeInstanceOf(WebVoiceAdapter);
  });

  it("prefers NeuroSparkVoice when present on a native platform", () => {
    setCapacitor({
      isNativePlatform: () => true,
      getPlatform: () => "ios",
      Plugins: {
        NeuroSparkVoice: {
          capabilities: vi.fn(),
          speak: vi.fn(),
          cancelSpeech: vi.fn(),
          startListening: vi.fn(),
          stopListening: vi.fn(),
          isListening: vi.fn(),
          isSpeaking: vi.fn(),
        },
        TextToSpeech: { speak: vi.fn(), stop: vi.fn() },
        SpeechRecognition: { available: vi.fn() },
      },
    });
    const adapter = pickAdapter();
    const caps = adapter.capabilities();
    expect(caps.platform).toBe("ios");
    expect(caps.tts).toBe(true);
    expect(caps.stt).toBe(true);
    expect(caps.wakeWord).toBe("platform");
    expect(adapter).not.toBeInstanceOf(WebVoiceAdapter);
  });

  it("uses community plugins when NeuroSparkVoice is absent on native", () => {
    setCapacitor({
      isNativePlatform: () => true,
      getPlatform: () => "android",
      Plugins: {
        TextToSpeech: { speak: vi.fn().mockResolvedValue(undefined), stop: vi.fn().mockResolvedValue(undefined) },
        SpeechRecognition: {
          available: vi.fn().mockResolvedValue({ available: true }),
          start: vi.fn(),
          stop: vi.fn(),
          addListener: vi.fn(),
        },
      },
    });
    const adapter = pickAdapter();
    expect(adapter).not.toBeInstanceOf(WebVoiceAdapter);
    const caps = adapter.capabilities();
    expect(caps.platform).toBe("android");
    expect(caps.tts).toBe(true);
    expect(caps.stt).toBe(true);
    expect(caps.bargeIn).toBe(true);
    expect(caps.wakeWord).toBe("none");
  });

  it("composes community TTS with web STT when only TextToSpeech is installed", () => {
    setCapacitor({
      isNativePlatform: () => true,
      getPlatform: () => "ios",
      Plugins: {
        TextToSpeech: { speak: vi.fn().mockResolvedValue(undefined), stop: vi.fn().mockResolvedValue(undefined) },
      },
    });
    const adapter = pickAdapter();
    expect(adapter).not.toBeInstanceOf(WebVoiceAdapter);
    const caps = adapter.capabilities();
    expect(caps.tts).toBe(true);
    expect(caps.platform).toBe("ios");
  });

  it("calls TextToSpeech.speak with mapped options and fires onEnd", async () => {
    const speak = vi.fn().mockResolvedValue(undefined);
    setCapacitor({
      isNativePlatform: () => true,
      getPlatform: () => "android",
      Plugins: {
        TextToSpeech: { speak, stop: vi.fn().mockResolvedValue(undefined) },
      },
    });
    const adapter = pickAdapter();
    const onEnd = vi.fn();
    await adapter.speak({ text: "hello", locale: "en-US", rate: 1.1, pitch: 0.9, onEnd });
    expect(speak).toHaveBeenCalledWith({
      text: "hello",
      lang: "en-US",
      rate: 1.1,
      pitch: 0.9,
    });
    expect(onEnd).toHaveBeenCalled();
  });

  it("caches the adapter across pickAdapter() calls", () => {
    const a1 = pickAdapter();
    const a2 = pickAdapter();
    expect(a1).toBe(a2);
  });

  it("__resetVoiceAdapterForTests clears the cache", () => {
    const a1 = pickAdapter();
    __resetVoiceAdapterForTests();
    setCapacitor({
      isNativePlatform: () => true,
      getPlatform: () => "ios",
      Plugins: {
        TextToSpeech: { speak: vi.fn(), stop: vi.fn() },
      },
    });
    const a2 = pickAdapter();
    expect(a1).not.toBe(a2);
  });
});

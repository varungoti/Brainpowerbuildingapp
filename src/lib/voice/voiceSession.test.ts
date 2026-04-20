import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { VoiceSession } from "./voiceSession";
import type { VoiceAdapter, VoiceCapabilities, STTOptions, TTSOptions } from "./voiceAdapter";

vi.mock("../../utils/productAnalytics", () => ({
  captureProductEvent: vi.fn(),
}));

class MockAdapter implements VoiceAdapter {
  speakOpts?: TTSOptions;
  sttOpts?: STTOptions;
  speaking = false;
  listening = false;
  cancelSpeechCalls = 0;

  capabilities(): VoiceCapabilities {
    return { tts: true, stt: true, bargeIn: true, wakeWord: "none", platform: "web" };
  }
  async speak(opts: TTSOptions): Promise<void> {
    this.speakOpts = opts;
    this.speaking = true;
  }
  cancelSpeech(): void {
    this.cancelSpeechCalls++;
    this.speaking = false;
  }
  async startListening(opts: STTOptions): Promise<void> {
    this.sttOpts = opts;
    this.listening = true;
  }
  stopListening(): void {
    this.listening = false;
  }
  isListening(): boolean { return this.listening; }
  isSpeaking(): boolean { return this.speaking; }
}

describe("VoiceSession FSM", () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle and transitions to listen on start()", async () => {
    const states: string[] = [];
    const session = new VoiceSession({
      adapter,
      agent: "coach",
      locale: "en-US",
      onTurn: async () => "hello",
      onStateChange: (s) => states.push(s),
    });

    expect(session.getState()).toBe("idle");
    await session.start();
    expect(session.getState()).toBe("listen");
    expect(states[0]).toBe("listen");
  });

  it("ignores start() when already in non-idle state", async () => {
    const session = new VoiceSession({
      adapter, agent: "coach", locale: "en-US",
      onTurn: async () => "x",
    });
    await session.start();
    const calls = adapter.sttOpts;
    await session.start();
    expect(adapter.sttOpts).toBe(calls);
  });

  it("listen → think → speak → idle on a successful turn", async () => {
    const states: string[] = [];
    const session = new VoiceSession({
      adapter, agent: "coach", locale: "en-US",
      onTurn: async () => "great work!",
      onStateChange: (s) => states.push(s),
    });
    await session.start();
    expect(session.getState()).toBe("listen");

    await adapter.sttOpts!.onFinal!("Hi there");
    // Allow microtasks to settle
    await Promise.resolve();
    await Promise.resolve();
    expect(session.getState()).toBe("speak");
    expect(adapter.speakOpts?.text).toBe("great work!");

    adapter.speakOpts!.onEnd!();
    expect(session.getState()).toBe("idle");
    expect(session.getTurns()).toHaveLength(1);
  });

  it("empty final transcript returns straight to idle", async () => {
    const session = new VoiceSession({
      adapter, agent: "coach", locale: "en-US",
      onTurn: async () => "x",
    });
    await session.start();
    await adapter.sttOpts!.onFinal!("");
    expect(session.getState()).toBe("idle");
  });

  it("bargeIn() during speak cancels TTS and returns to idle", async () => {
    const session = new VoiceSession({
      adapter, agent: "coach", locale: "en-US",
      onTurn: async () => "long reply",
    });
    await session.start();
    await adapter.sttOpts!.onFinal!("Hello");
    await Promise.resolve();
    await Promise.resolve();
    session.bargeIn();
    expect(adapter.cancelSpeechCalls).toBeGreaterThan(0);
    expect(session.getState()).toBe("idle");
  });

  it("bargeIn() outside of speak is a no-op", async () => {
    const session = new VoiceSession({
      adapter, agent: "coach", locale: "en-US",
      onTurn: async () => "x",
    });
    session.bargeIn();
    expect(session.getState()).toBe("idle");
    expect(adapter.cancelSpeechCalls).toBe(0);
  });

  it("error state auto-resets to idle after 2.4s", async () => {
    const session = new VoiceSession({
      adapter, agent: "coach", locale: "en-US",
      onTurn: async () => { throw new Error("network down"); },
    });
    await session.start();
    await adapter.sttOpts!.onFinal!("Hi");
    await Promise.resolve();
    await Promise.resolve();
    expect(session.getState()).toBe("error");
    vi.advanceTimersByTime(2500);
    expect(session.getState()).toBe("idle");
  });

  it("partial results update transcript without changing state", async () => {
    const session = new VoiceSession({
      adapter, agent: "coach", locale: "en-US",
      onTurn: async () => "x",
    });
    await session.start();
    adapter.sttOpts!.onPartial!("hel");
    expect(session.getTranscript()).toBe("hel");
    expect(session.getState()).toBe("listen");
    adapter.sttOpts!.onPartial!("hello");
    expect(session.getTranscript()).toBe("hello");
  });
});

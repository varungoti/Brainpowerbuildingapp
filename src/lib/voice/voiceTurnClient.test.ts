// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

// We mock both supabase helpers BEFORE importing the module under test so
// the dynamic JWT lookup hits our stub.
vi.mock("../../utils/supabase/info", () => ({
  functionsBaseUrl: "https://example.com/make-server-76b0ba9a",
  publicAnonKey: "anon-key-test",
}));
vi.mock("../../utils/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getSession: async () => ({ data: { session: { access_token: "jwt-test" } } }) },
  }),
}));

import { speakViaVoiceTurnEdge } from "./voiceTurnClient";

function mkSseStream(events: string[]): Response {
  const body = events.join("");
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(body));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("speakViaVoiceTurnEdge", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("assembles the streamed reply from token events", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mkSseStream([
        `event: token\ndata: {"t":"Hi"}\n\n`,
        `event: token\ndata: {"t":" there"}\n\n`,
        `event: done\ndata: {"text":"Hi there!"}\n\n`,
      ]),
    );

    const tokens: string[] = [];
    const reply = await speakViaVoiceTurnEdge({
      agent: "coach",
      utterance: "hello",
      onToken: (t) => tokens.push(t),
    });

    expect(reply).toBe("Hi there!");
    expect(tokens).toEqual(["Hi", " there"]);

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("/voice/turn");
    expect(init).toBeDefined();
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer jwt-test",
      apikey: "anon-key-test",
    });
  });

  it("throws on HTTP non-2xx response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 503 }),
    );
    await expect(
      speakViaVoiceTurnEdge({ agent: "coach", utterance: "hi" }),
    ).rejects.toThrow(/voice_turn_http_503/);
  });

  it("throws when the stream emits an error event", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mkSseStream([`event: error\ndata: {"message":"upstream_error"}\n\n`]),
    );
    await expect(
      speakViaVoiceTurnEdge({ agent: "coach", utterance: "hi" }),
    ).rejects.toThrow(/voice_turn_upstream_error/);
  });
});

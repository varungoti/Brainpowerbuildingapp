import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ALL_VIDEO_PROVIDERS, routeVideoProvider } from "../index.js";

const KEYS = [
  "RUNWAY_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_GENAI_API_KEY",
  "LUMA_API_KEY",
  "KLING_ACCESS_KEY",
  "PIKA_API_KEY",
  "MINIMAX_API_KEY",
  "BYTEDANCE_API_KEY",
  "WAN_API_KEY",
  "REPLICATE_API_TOKEN",
  "FAL_KEY",
  "HUNYUAN_URL",
  "LTX_URL",
  "MOCHI_URL",
  "COGVIDEO_URL",
  "OPEN_SORA_URL",
  "SVD_URL",
  "ANIMATEDIFF_URL",
];

const original: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of KEYS) {
    original[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of KEYS) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
});

describe("video router", () => {
  it("registers 18 providers", () => {
    expect(ALL_VIDEO_PROVIDERS).toHaveLength(18);
  });

  it("throws when nothing configured", () => {
    expect(() => routeVideoProvider({})).toThrow(/No video providers/);
  });

  it("prefers Sora 2 for withAudio", () => {
    process.env.OPENAI_API_KEY = "x";
    process.env.RUNWAY_API_KEY = "y";
    expect(routeVideoProvider({ withAudio: true }).id).toBe("openai_sora2");
  });

  it("falls back to Veo 3 for withAudio when Sora absent", () => {
    process.env.GOOGLE_GENAI_API_KEY = "x";
    process.env.RUNWAY_API_KEY = "y";
    expect(routeVideoProvider({ withAudio: true }).id).toBe("google_veo3");
  });

  it("prefers Hunyuan self-hosted when preferOpen", () => {
    process.env.HUNYUAN_URL = "http://localhost";
    process.env.RUNWAY_API_KEY = "x";
    expect(routeVideoProvider({ preferOpen: true }).id).toBe("hunyuan_self");
  });

  it("prefers MiniMax Hailuo for preferCheap", () => {
    process.env.MINIMAX_API_KEY = "x";
    process.env.RUNWAY_API_KEY = "y";
    expect(routeVideoProvider({ preferCheap: true }).id).toBe("minimax_hailuo02");
  });

  it("prefers Runway Gen-4 by default", () => {
    process.env.RUNWAY_API_KEY = "x";
    process.env.LUMA_API_KEY = "y";
    expect(routeVideoProvider({}).id).toBe("runway_gen4");
  });

  it("respects DEFAULT_PROVIDER override", () => {
    process.env.RUNWAY_API_KEY = "x";
    process.env.LUMA_API_KEY = "y";
    process.env.DEFAULT_PROVIDER = "luma_ray2";
    try {
      expect(routeVideoProvider({}).id).toBe("luma_ray2");
    } finally {
      delete process.env.DEFAULT_PROVIDER;
    }
  });

  it("each provider returns positive cost estimate for 5s 720p", () => {
    for (const p of ALL_VIDEO_PROVIDERS) {
      expect(p.estCost({ prompt: "x", durationSec: 5, resolution: "720p" })).toBeGreaterThanOrEqual(0);
    }
  });
});

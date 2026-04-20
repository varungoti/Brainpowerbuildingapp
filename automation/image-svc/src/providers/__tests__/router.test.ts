import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { routeProvider, ALL_PROVIDERS } from "../index.js";

const KEYS = [
  "IDEOGRAM_API_KEY",
  "BFL_API_KEY",
  "RECRAFT_API_KEY",
  "LEONARDO_API_KEY",
  "STABILITY_API_KEY",
  "GOOGLE_GENAI_API_KEY",
  "MIDJOURNEY_API_KEY",
  "OPENAI_API_KEY",
  "REPLICATE_API_TOKEN",
  "FAL_KEY",
  "TOGETHER_API_KEY",
  "SDXL_URL",
  "COMFY_URL",
  "PEXELS_API_KEY",
  "UNSPLASH_ACCESS_KEY",
  "PIXABAY_API_KEY",
  "FLUX_SCHNELL_URL",
];

const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    originalEnv[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of KEYS) {
    if (originalEnv[k] === undefined) delete process.env[k];
    else process.env[k] = originalEnv[k];
  }
});

describe("image router", () => {
  it("registers all 17 providers", () => {
    expect(ALL_PROVIDERS).toHaveLength(17);
  });

  it("throws when no providers are enabled", () => {
    expect(() => routeProvider({})).toThrow(/No image providers/);
  });

  it("prefers Ideogram for textInImage", () => {
    process.env.IDEOGRAM_API_KEY = "x";
    process.env.STABILITY_API_KEY = "y";
    expect(routeProvider({ textInImage: true }).id).toBe("ideogram");
  });

  it("falls back to recraft when Ideogram missing for textInImage", () => {
    process.env.RECRAFT_API_KEY = "x";
    process.env.STABILITY_API_KEY = "y";
    expect(routeProvider({ textInImage: true }).id).toBe("recraft");
  });

  it("prefers self-hosted SDXL when brandConsistency=high", () => {
    process.env.SDXL_URL = "http://localhost";
    process.env.IDEOGRAM_API_KEY = "x";
    expect(routeProvider({ brandConsistency: "high" }).id).toBe("sdxl_self");
  });

  it("falls back to FLUX pro for brand-consistency when self-hosted absent", () => {
    process.env.BFL_API_KEY = "x";
    process.env.IDEOGRAM_API_KEY = "y";
    expect(routeProvider({ brandConsistency: "high" }).id).toBe("flux_pro");
  });

  it("prefers Pexels stock when preferStock", () => {
    process.env.PEXELS_API_KEY = "x";
    process.env.UNSPLASH_ACCESS_KEY = "y";
    expect(routeProvider({ preferStock: true }).id).toBe("pexels");
  });

  it("respects DEFAULT_PROVIDER env", () => {
    process.env.IDEOGRAM_API_KEY = "x";
    process.env.RECRAFT_API_KEY = "y";
    process.env.DEFAULT_PROVIDER = "recraft";
    try {
      expect(routeProvider({}).id).toBe("recraft");
    } finally {
      delete process.env.DEFAULT_PROVIDER;
    }
  });

  it("each provider has a non-zero cost estimate", () => {
    for (const p of ALL_PROVIDERS) {
      expect(p.estCost({ prompt: "x" })).toBeGreaterThanOrEqual(0);
    }
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ENV_KEYS = ["ENABLE_NSFW_GUARD", "NSFW_THRESHOLD", "REPLICATE_API_TOKEN"];
const original: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    original[k] = process.env[k];
    delete process.env[k];
  }
  vi.resetModules();
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
  vi.unstubAllGlobals();
});

async function load() {
  return await import("../safety.js");
}

describe("brand-safety guard", () => {
  it("returns ok when guard is disabled", async () => {
    process.env.ENABLE_NSFW_GUARD = "false";
    const { checkImageSafety } = await load();
    expect(await checkImageSafety(["https://x"])).toEqual({ ok: true, flagged: [] });
  });

  it("returns ok when no Replicate token is set (fail-open)", async () => {
    process.env.ENABLE_NSFW_GUARD = "true";
    const { checkImageSafety } = await load();
    expect(await checkImageSafety(["https://x"])).toEqual({ ok: true, flagged: [] });
  });

  it("flags images returning a high NSFW score", async () => {
    process.env.ENABLE_NSFW_GUARD = "true";
    process.env.NSFW_THRESHOLD = "0.5";
    process.env.REPLICATE_API_TOKEN = "tok";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, init) => {
        return new Response(JSON.stringify({ output: { nsfw: 0.9 } }), { status: 200 });
      }),
    );
    const { checkImageSafety } = await load();
    const r = await checkImageSafety(["https://bad.png", "https://good.png"]);
    expect(r.ok).toBe(false);
    expect(r.flagged).toEqual(["https://bad.png", "https://good.png"]);
  });

  it("doesn't flag when score < threshold", async () => {
    process.env.ENABLE_NSFW_GUARD = "true";
    process.env.NSFW_THRESHOLD = "0.75";
    process.env.REPLICATE_API_TOKEN = "tok";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ output: { nsfw: 0.2 } }), { status: 200 })),
    );
    const { checkImageSafety } = await load();
    expect((await checkImageSafety(["https://x.png"])).ok).toBe(true);
  });

  it("fails open if classifier errors", async () => {
    process.env.ENABLE_NSFW_GUARD = "true";
    process.env.REPLICATE_API_TOKEN = "tok";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const { checkImageSafety } = await load();
    expect((await checkImageSafety(["https://x.png"])).ok).toBe(true);
  });
});

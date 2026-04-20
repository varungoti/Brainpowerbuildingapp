import type { ImageResult, ImageSpec, Provider } from "../types.js";

/**
 * Midjourney has no official public API. We use UseAPI.net / GoAPI / TheNextLeg
 * style 3rd-party proxies; pick one and set MIDJOURNEY_API_KEY + base URL.
 */
const KEY = process.env.MIDJOURNEY_API_KEY;
const BASE = process.env.MIDJOURNEY_BASE_URL ?? "https://api.useapi.net/v2/jobs";

export const midjourney: Provider = {
  id: "midjourney",
  enabled: () => Boolean(KEY),
  estCost: () => 0.1,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!KEY) throw new Error("MIDJOURNEY_API_KEY not set");
    const t0 = Date.now();
    const aspect = spec.aspect ?? "1:1";
    const fullPrompt = `${spec.prompt} --ar ${aspect} --v 6.1`;
    const create = await fetch(`${BASE}/imagine`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: fullPrompt, mode: "fast" }),
    });
    if (!create.ok) throw new Error(`MJ create ${create.status}`);
    const { jobid } = (await create.json()) as { jobid: string };
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const poll = await fetch(`${BASE}/${jobid}`, { headers: { Authorization: `Bearer ${KEY}` } });
      const j = (await poll.json()) as { status: string; attachments?: Array<{ url: string }> };
      if (j.status === "completed" && j.attachments?.[0]?.url) {
        return {
          url: j.attachments[0].url,
          provider: "midjourney",
          costUSD: 0.1,
          latencyMs: Date.now() - t0,
          width: 1024,
          height: 1024,
          seed: spec.seed,
        };
      }
      if (j.status === "failed") throw new Error("MJ job failed");
    }
    throw new Error("MJ job timed out");
  },
};

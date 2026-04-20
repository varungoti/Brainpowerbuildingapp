import type { ImageResult, ImageSpec, Provider } from "../types.js";

const KEY = process.env.TOGETHER_API_KEY;

export const together: Provider = {
  id: "together",
  enabled: () => Boolean(KEY),
  estCost: () => 0.003,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!KEY) throw new Error("TOGETHER_API_KEY not set");
    const t0 = Date.now();
    const dims = spec.aspect === "9:16" ? [768, 1344] : spec.aspect === "16:9" ? [1344, 768] : [1024, 1024];
    const res = await fetch("https://api.together.xyz/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "black-forest-labs/FLUX.1-schnell-Free",
        prompt: spec.prompt,
        width: dims[0],
        height: dims[1],
        steps: 4,
        n: 1,
        seed: spec.seed,
      }),
    });
    if (!res.ok) throw new Error(`Together ${res.status}: ${await res.text()}`);
    const j = (await res.json()) as { data: Array<{ url: string }> };
    return {
      url: j.data[0].url,
      provider: "together",
      costUSD: 0.003,
      latencyMs: Date.now() - t0,
      width: dims[0],
      height: dims[1],
      seed: spec.seed,
    };
  },
};

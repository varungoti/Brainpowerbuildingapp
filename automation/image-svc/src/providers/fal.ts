import type { ImageResult, ImageSpec, Provider } from "../types.js";

const KEY = process.env.FAL_KEY;

export const fal: Provider = {
  id: "fal",
  enabled: () => Boolean(KEY),
  estCost: () => 0.025,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!KEY) throw new Error("FAL_KEY not set");
    const t0 = Date.now();
    const model = spec.style?.startsWith("fal:") ? spec.style.slice(4) : "fal-ai/flux/schnell";
    const res = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: { Authorization: `Key ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: spec.prompt,
        image_size: spec.aspect === "9:16" ? "portrait_16_9" : spec.aspect === "16:9" ? "landscape_16_9" : "square_hd",
        num_inference_steps: 4,
        seed: spec.seed,
      }),
    });
    if (!res.ok) throw new Error(`fal ${res.status}: ${await res.text()}`);
    const j = (await res.json()) as { images: Array<{ url: string; width: number; height: number }> };
    return {
      url: j.images[0].url,
      provider: "fal",
      costUSD: 0.025,
      latencyMs: Date.now() - t0,
      width: j.images[0].width,
      height: j.images[0].height,
      seed: spec.seed,
    };
  },
};

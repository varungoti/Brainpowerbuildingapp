import type { ImageResult, ImageSpec, Provider } from "../types.js";

const KEY = process.env.IDEOGRAM_API_KEY;

export const ideogram: Provider = {
  id: "ideogram",
  enabled: () => Boolean(KEY),
  estCost: () => 0.06,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!KEY) throw new Error("IDEOGRAM_API_KEY not set");
    const t0 = Date.now();
    const res = await fetch("https://api.ideogram.ai/v1/ideogram-v3/generate", {
      method: "POST",
      headers: { "Api-Key": KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: spec.prompt,
        aspect_ratio: (spec.aspect ?? "1:1").replace(":", "x"),
        rendering_speed: "DEFAULT",
        magic_prompt: "AUTO",
        negative_prompt: spec.negativePrompt,
        seed: spec.seed,
      }),
    });
    if (!res.ok) throw new Error(`Ideogram error ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { data?: Array<{ url: string; resolution?: string }> };
    const first = data.data?.[0];
    if (!first?.url) throw new Error("Ideogram returned no image");
    const [w, h] = (first.resolution ?? "1024x1024").split("x").map(Number);
    return {
      url: first.url,
      provider: "ideogram",
      costUSD: 0.06,
      latencyMs: Date.now() - t0,
      width: w ?? 1024,
      height: h ?? 1024,
      seed: spec.seed,
      raw: data,
    };
  },
};

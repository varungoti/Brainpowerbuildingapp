import type { ImageResult, ImageSpec, Provider } from "../types.js";

const KEY = process.env.STABILITY_API_KEY;

export const stabilitySD35: Provider = {
  id: "stability_sd35",
  enabled: () => Boolean(KEY),
  estCost: () => 0.065,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!KEY) throw new Error("STABILITY_API_KEY not set");
    const t0 = Date.now();
    const form = new FormData();
    form.set("prompt", spec.prompt);
    if (spec.negativePrompt) form.set("negative_prompt", spec.negativePrompt);
    form.set("aspect_ratio", spec.aspect ?? "1:1");
    form.set("model", "sd3.5-large");
    form.set("output_format", "png");
    if (spec.seed !== undefined) form.set("seed", String(spec.seed));
    const res = await fetch("https://api.stability.ai/v2beta/stable-image/generate/sd3", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, Accept: "image/*" },
      body: form,
    });
    if (!res.ok) throw new Error(`Stability ${res.status}: ${await res.text()}`);
    const blob = await res.arrayBuffer();
    const dataUrl = `data:image/png;base64,${Buffer.from(blob).toString("base64")}`;
    return {
      url: dataUrl,
      provider: "stability_sd35",
      costUSD: 0.065,
      latencyMs: Date.now() - t0,
      width: 1024,
      height: 1024,
      seed: spec.seed,
    };
  },
};

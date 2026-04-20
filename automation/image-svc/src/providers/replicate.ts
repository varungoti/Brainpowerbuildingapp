import type { ImageResult, ImageSpec, Provider } from "../types.js";

/**
 * Replicate wildcard router. Pass the model slug via spec.style if you want
 * to override; otherwise we use FLUX schnell as the default fast/cheap path.
 */
const KEY = process.env.REPLICATE_API_TOKEN;
const DEFAULT_MODEL = "black-forest-labs/flux-schnell";

export const replicate: Provider = {
  id: "replicate",
  enabled: () => Boolean(KEY),
  estCost: () => 0.003,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!KEY) throw new Error("REPLICATE_API_TOKEN not set");
    const t0 = Date.now();
    const model = spec.style?.startsWith("replicate:")
      ? spec.style.slice("replicate:".length)
      : DEFAULT_MODEL;
    const create = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "wait=60" },
      body: JSON.stringify({
        input: {
          prompt: spec.prompt,
          aspect_ratio: spec.aspect ?? "1:1",
          seed: spec.seed,
          output_format: "png",
        },
      }),
    });
    if (!create.ok) throw new Error(`Replicate ${create.status}: ${await create.text()}`);
    const j = (await create.json()) as { output: string | string[]; status: string };
    const url = Array.isArray(j.output) ? j.output[0] : j.output;
    return {
      url,
      provider: "replicate",
      costUSD: 0.003,
      latencyMs: Date.now() - t0,
      width: spec.size ?? 1024,
      height: spec.size ?? 1024,
      seed: spec.seed,
    };
  },
};

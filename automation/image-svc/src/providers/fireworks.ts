import type { ImageResult, ImageSpec, Provider } from "../types.js";

const KEY = process.env.FIREWORKS_API_KEY;
const MODEL = process.env.FIREWORKS_IMAGE_MODEL ?? "flux-1-schnell-fp8";

function aspectToWh(aspect: string, base = 1024): { width: number; height: number } {
  const [a, b] = aspect.split(":").map(Number);
  if (!a || !b) return { width: base, height: base };
  if (a >= b) return { width: base, height: Math.round((base * b) / a) };
  return { width: Math.round((base * a) / b), height: base };
}

function cost(steps = 4): number {
  return Math.max(1, steps) * 0.00035;
}

export const fireworksFluxSchnell: Provider = {
  id: "fireworks_flux_schnell",
  enabled: () => Boolean(KEY) && process.env.AI_IMAGES_PAUSED !== "true",
  estCost: () => cost(4),
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!KEY) throw new Error("FIREWORKS_API_KEY not set");
    const t0 = Date.now();
    const aspect = spec.aspect ?? "4:3";
    const { width, height } = aspectToWh(aspect, spec.size ?? 1024);
    const res = await fetch(
      `https://api.fireworks.ai/inference/v1/workflows/accounts/fireworks/models/${MODEL}/text_to_image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${KEY}`,
        },
        body: JSON.stringify({
          prompt: [spec.prompt, spec.style ? `Style: ${spec.style}.` : "", "No text in image. Child-safe, supervised, household-safe."].filter(Boolean).join(" "),
          negative_prompt: spec.negativePrompt,
          aspect_ratio: aspect,
          num_inference_steps: 4,
          seed: spec.seed ?? 0,
          safety_check: true,
        }),
      },
    );
    if (!res.ok) throw new Error(`Fireworks FLUX error ${res.status}: ${await res.text()}`);
    const data = await res.json() as { base64?: string[]; seed?: number; finishReason?: string };
    if (data.finishReason === "CONTENT_FILTERED") throw new Error("Fireworks content filtered");
    const url = data.base64?.[0];
    if (!url) throw new Error("Fireworks returned no image");
    return {
      url,
      provider: "fireworks_flux_schnell",
      costUSD: cost(4),
      latencyMs: Date.now() - t0,
      width,
      height,
      seed: data.seed ?? spec.seed,
      raw: { model: MODEL },
    };
  },
};

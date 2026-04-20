import type { ImageResult, ImageSpec, Provider } from "../types.js";

/**
 * Self-hosted SDXL + IPAdapter-FaceID for brand character consistency.
 * Expects a sidecar that exposes:
 *   POST /sdxl/generate { prompt, negative_prompt, width, height, seed, ref_image_url }
 *   -> { url, width, height }
 */
const SDXL_URL = process.env.SDXL_URL;
const SDXL_TOKEN = process.env.SDXL_TOKEN;

export const sdxlSelf: Provider = {
  id: "sdxl_self",
  enabled: () => Boolean(SDXL_URL),
  estCost: () => 0.0,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!SDXL_URL) throw new Error("SDXL_URL not set");
    const t0 = Date.now();
    const dimsMap: Record<string, [number, number]> = {
      "1:1": [1024, 1024],
      "16:9": [1344, 768],
      "9:16": [768, 1344],
    };
    const [width, height] = dimsMap[spec.aspect ?? "1:1"] ?? [1024, 1024];
    const res = await fetch(`${SDXL_URL}/sdxl/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SDXL_TOKEN ? { Authorization: `Bearer ${SDXL_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        prompt: spec.prompt,
        negative_prompt: spec.negativePrompt,
        width,
        height,
        seed: spec.seed,
        ref_image_url: spec.refImageUrl,
        ipadapter_strength: spec.refImageUrl ? 0.7 : 0,
      }),
    });
    if (!res.ok) throw new Error(`SDXL self ${res.status}: ${await res.text()}`);
    const j = (await res.json()) as { url: string; width: number; height: number };
    return {
      url: j.url,
      provider: "sdxl_self",
      costUSD: 0,
      latencyMs: Date.now() - t0,
      width: j.width,
      height: j.height,
      seed: spec.seed,
    };
  },
};

const COMFY_URL = process.env.COMFY_URL;
const COMFY_TOKEN = process.env.COMFY_TOKEN;

export const comfySelf: Provider = {
  id: "comfy_self",
  enabled: () => Boolean(COMFY_URL),
  estCost: () => 0.0,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!COMFY_URL) throw new Error("COMFY_URL not set");
    const t0 = Date.now();
    const res = await fetch(`${COMFY_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(COMFY_TOKEN ? { Authorization: `Bearer ${COMFY_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        workflow: spec.style?.startsWith("comfy:") ? spec.style.slice(6) : "default_brand",
        inputs: {
          prompt: spec.prompt,
          negative_prompt: spec.negativePrompt,
          seed: spec.seed,
          ref_image_url: spec.refImageUrl,
        },
      }),
    });
    if (!res.ok) throw new Error(`Comfy self ${res.status}`);
    const j = (await res.json()) as { url: string; width: number; height: number };
    return {
      url: j.url,
      provider: "comfy_self",
      costUSD: 0,
      latencyMs: Date.now() - t0,
      width: j.width,
      height: j.height,
      seed: spec.seed,
    };
  },
};

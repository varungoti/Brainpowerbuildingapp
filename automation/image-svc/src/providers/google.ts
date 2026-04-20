import type { ImageResult, ImageSpec, Provider } from "../types.js";

const KEY = process.env.GOOGLE_GENAI_API_KEY;

export const googleImagen4: Provider = {
  id: "google_imagen4",
  enabled: () => Boolean(KEY),
  estCost: () => 0.06,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!KEY) throw new Error("GOOGLE_GENAI_API_KEY not set");
    const t0 = Date.now();
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-preview-06-06:predict";
    const res = await fetch(`${url}?key=${KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: spec.prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: spec.aspect ?? "1:1",
          personGeneration: "allow_adult",
        },
      }),
    });
    if (!res.ok) throw new Error(`Imagen ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      predictions: Array<{ bytesBase64Encoded: string; mimeType: string }>;
    };
    const first = data.predictions[0];
    const dataUrl = `data:${first.mimeType};base64,${first.bytesBase64Encoded}`;
    return {
      url: dataUrl,
      provider: "google_imagen4",
      costUSD: 0.06,
      latencyMs: Date.now() - t0,
      width: 1024,
      height: 1024,
      seed: spec.seed,
    };
  },
};

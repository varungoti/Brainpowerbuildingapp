import type { ImageResult, ImageSpec, Provider } from "../types.js";

const KEY = process.env.OPENAI_API_KEY;

export const openaiGptImage: Provider = {
  id: "openai_gpt_image",
  enabled: () => Boolean(KEY),
  estCost: (spec) => (spec.size && spec.size > 1024 ? 0.17 : 0.04),
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!KEY) throw new Error("OPENAI_API_KEY not set");
    const t0 = Date.now();
    const sizeMap: Record<string, "1024x1024" | "1024x1536" | "1536x1024"> = {
      "1:1": "1024x1024",
      "9:16": "1024x1536",
      "16:9": "1536x1024",
      "2:3": "1024x1536",
      "3:2": "1536x1024",
    };
    const size = sizeMap[spec.aspect ?? "1:1"] ?? "1024x1024";
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: spec.prompt,
        size,
        quality: "high",
        n: 1,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI image ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { data: Array<{ b64_json?: string; url?: string }> };
    const first = data.data[0];
    const url = first.url ?? `data:image/png;base64,${first.b64_json}`;
    const [w, h] = size.split("x").map(Number);
    return {
      url,
      provider: "openai_gpt_image",
      costUSD: openaiGptImage.estCost(spec),
      latencyMs: Date.now() - t0,
      width: w,
      height: h,
      seed: spec.seed,
    };
  },
};

import type { ImageResult, ImageSpec, Provider } from "../types.js";

const KEY = process.env.RECRAFT_API_KEY;

export const recraft: Provider = {
  id: "recraft",
  enabled: () => Boolean(KEY),
  estCost: () => 0.04,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!KEY) throw new Error("RECRAFT_API_KEY not set");
    const t0 = Date.now();
    const sizeMap: Record<string, string> = {
      "1:1": "1024x1024",
      "16:9": "1820x1024",
      "9:16": "1024x1820",
      "3:2": "1536x1024",
      "2:3": "1024x1536",
    };
    const size = sizeMap[spec.aspect ?? "1:1"] ?? "1024x1024";
    const res = await fetch("https://external.api.recraft.ai/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: spec.prompt,
        style: spec.style ?? "digital_illustration",
        model: "recraftv3",
        size,
        n: 1,
      }),
    });
    if (!res.ok) throw new Error(`Recraft ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { data: Array<{ url: string }> };
    const [w, h] = size.split("x").map(Number);
    return {
      url: data.data[0].url,
      provider: "recraft",
      costUSD: 0.04,
      latencyMs: Date.now() - t0,
      width: w,
      height: h,
      seed: spec.seed,
    };
  },
};

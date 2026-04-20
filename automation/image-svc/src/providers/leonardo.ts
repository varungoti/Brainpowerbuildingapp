import type { ImageResult, ImageSpec, Provider } from "../types.js";

const KEY = process.env.LEONARDO_API_KEY;
const PHOENIX_MODEL_ID = "6b645e3a-d64f-4341-a6d8-7a3690fbf042";

export const leonardo: Provider = {
  id: "leonardo",
  enabled: () => Boolean(KEY),
  estCost: () => 0.04,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!KEY) throw new Error("LEONARDO_API_KEY not set");
    const t0 = Date.now();
    const dimsMap: Record<string, [number, number]> = {
      "1:1": [1024, 1024],
      "16:9": [1472, 832],
      "9:16": [832, 1472],
      "3:2": [1280, 832],
      "2:3": [832, 1280],
    };
    const [width, height] = dimsMap[spec.aspect ?? "1:1"] ?? [1024, 1024];
    const create = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: spec.prompt,
        negative_prompt: spec.negativePrompt,
        modelId: PHOENIX_MODEL_ID,
        width,
        height,
        num_images: 1,
        seed: spec.seed,
      }),
    });
    if (!create.ok) throw new Error(`Leonardo create ${create.status}: ${await create.text()}`);
    const { sdGenerationJob } = (await create.json()) as {
      sdGenerationJob: { generationId: string };
    };
    const id = sdGenerationJob.generationId;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${id}`, {
        headers: { Authorization: `Bearer ${KEY}` },
      });
      if (!poll.ok) continue;
      const j = (await poll.json()) as {
        generations_by_pk: { status: string; generated_images: Array<{ url: string }> };
      };
      const g = j.generations_by_pk;
      if (g.status === "COMPLETE" && g.generated_images?.[0]?.url) {
        return {
          url: g.generated_images[0].url,
          provider: "leonardo",
          costUSD: 0.04,
          latencyMs: Date.now() - t0,
          width,
          height,
          seed: spec.seed,
        };
      }
      if (g.status === "FAILED") throw new Error("Leonardo job failed");
    }
    throw new Error("Leonardo job timed out");
  },
};

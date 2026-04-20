import type { ScenePlan, TemplateId } from "../types.js";

const SVC = process.env.IMAGE_SVC_URL;
const TOKEN = process.env.IMAGE_SVC_TOKEN ?? "";

const ASPECT_BY_TEMPLATE: Record<TemplateId, string> = {
  HeroAnnouncement: "9:16",
  FeatureSpotlight: "9:16",
  TestimonialCard: "1:1",
  BrainStoryShort: "9:16",
  ResearchExplainer: "16:9",
  AppDemo: "16:9",
};

export async function generateSceneImages(opts: {
  jobId: string;
  template: TemplateId;
  scenes: ScenePlan[];
}): Promise<{ scenes: ScenePlan[]; totalCostUSD: number }> {
  if (!SVC) throw new Error("IMAGE_SVC_URL not set");
  const aspect = ASPECT_BY_TEMPLATE[opts.template];

  const specs = opts.scenes
    .filter((s) => !s.useVideoClip)
    .map((s) => ({
      prompt: s.imagePrompt,
      aspect,
      brandConsistency: s.brandConsistency,
      textInImage: s.textInImage,
      providerId: s.imageProvider,
      sceneIdx: s.idx,
    }));

  const res = await fetch(`${SVC}/v1/generate/batch`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ specs, jobId: opts.jobId }),
  });
  if (!res.ok) throw new Error(`image-svc batch ${res.status}: ${await res.text()}`);
  const j = (await res.json()) as {
    results: Array<
      | { ok: true; url: string; provider: string; costUSD: number }
      | { ok: false; error: string }
    >;
  };

  let totalCost = 0;
  const updated = [...opts.scenes];
  let resultIdx = 0;
  for (const scene of updated) {
    if (scene.useVideoClip) continue;
    const r = j.results[resultIdx++];
    if (!r) continue;
    if (!r.ok) {
      throw new Error(`scene ${scene.idx} image failed: ${r.error}`);
    }
    scene.imageUrl = r.url;
    scene.imageProvider = r.provider;
    totalCost += r.costUSD;
  }
  return { scenes: updated, totalCostUSD: totalCost };
}

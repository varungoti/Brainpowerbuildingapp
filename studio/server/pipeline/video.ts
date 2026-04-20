import type { ScenePlan } from "../types.js";

const SVC = process.env.VIDEO_SVC_URL;
const TOKEN = process.env.VIDEO_SVC_TOKEN ?? "";

export async function generateSceneClips(opts: {
  jobId: string;
  scenes: ScenePlan[];
}): Promise<{ scenes: ScenePlan[]; totalCostUSD: number }> {
  if (!SVC) throw new Error("VIDEO_SVC_URL not set");
  const updated = [...opts.scenes];
  let totalCost = 0;

  for (const s of updated) {
    if (!s.useVideoClip) continue;
    const res = await fetch(`${SVC}/v1/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        spec: {
          prompt: s.imagePrompt,
          imageUrl: s.imageUrl,
          durationSec: s.durationSec,
          aspect: "9:16",
          resolution: "1080p",
        },
        providerId: s.videoProvider,
        jobId: opts.jobId,
      }),
    });
    if (!res.ok) throw new Error(`video-svc scene ${s.idx} ${res.status}: ${await res.text()}`);
    const j = (await res.json()) as { url: string; provider: string; costUSD: number };
    s.videoUrl = j.url;
    s.videoProvider = j.provider;
    totalCost += j.costUSD;
  }
  return { scenes: updated, totalCostUSD: totalCost };
}

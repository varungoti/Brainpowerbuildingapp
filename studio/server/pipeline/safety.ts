/**
 * Brand-safety guard. Wraps an async hook against scene image URLs and rejects
 * if any scene comes back >= NSFW_THRESHOLD. Default impl uses Replicate's
 * NSFW classifier; swap to a self-hosted CLIP model by changing the function.
 */
const ENABLE = (process.env.ENABLE_NSFW_GUARD ?? "true") === "true";
const THRESHOLD = Number(process.env.NSFW_THRESHOLD ?? 0.75);
const REPLICATE = process.env.REPLICATE_API_TOKEN;

export async function checkImageSafety(urls: string[]): Promise<{ ok: boolean; flagged: string[] }> {
  if (!ENABLE || urls.length === 0) return { ok: true, flagged: [] };
  if (!REPLICATE) return { ok: true, flagged: [] };

  const flagged: string[] = [];
  for (const url of urls) {
    try {
      const create = await fetch(
        "https://api.replicate.com/v1/models/falcons-ai/nsfw_image_detection/predictions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${REPLICATE}`,
            "Content-Type": "application/json",
            Prefer: "wait=20",
          },
          body: JSON.stringify({ input: { image: url } }),
        },
      );
      if (!create.ok) continue;
      const j = (await create.json()) as { output?: { nsfw?: number; label?: string; score?: number } };
      const score = j.output?.nsfw ?? j.output?.score ?? 0;
      const label = j.output?.label;
      if (score >= THRESHOLD || label === "nsfw") flagged.push(url);
    } catch {
      // fail-open on classifier outage; don't block the pipeline
    }
  }
  return { ok: flagged.length === 0, flagged };
}

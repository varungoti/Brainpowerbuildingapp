import { buildPrintableGuideFallback, hashPrintablePack } from "./guideFallback";
import type { PrintableGuide, PrintableGuideRequest } from "./guideTypes";
import { functionsBaseUrl } from "../../utils/supabase/info";

const CACHE_PREFIX = "neurospark:printable-guide:";

export function printableGuideCacheKey(req: PrintableGuideRequest): string {
  const child = (req.childName || "child").toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return `${CACHE_PREFIX}${child}:tier-${req.ageTier}:${hashPrintablePack(req.activities)}`;
}

export function getCachedPrintableGuide(req: PrintableGuideRequest): PrintableGuide | null {
  try {
    const raw = localStorage.getItem(printableGuideCacheKey(req));
    return raw ? JSON.parse(raw) as PrintableGuide : null;
  } catch {
    return null;
  }
}

export function cachePrintableGuide(req: PrintableGuideRequest, guide: PrintableGuide): void {
  try {
    localStorage.setItem(printableGuideCacheKey(req), JSON.stringify(guide));
  } catch {
    // Non-critical cache.
  }
}

export async function createPrintableGuide(req: PrintableGuideRequest): Promise<PrintableGuide> {
  if (!req.forceRefresh) {
    const cached = getCachedPrintableGuide(req);
    if (cached) return cached;
  }

  const fallback = buildPrintableGuideFallback(req);
  try {
    const res = await fetch(`${functionsBaseUrl.replace("/make-server-76b0ba9a", "")}/printable/guide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...req,
        activities: req.activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          emoji: activity.emoji,
          region: activity.region,
          description: activity.description,
          instructions: activity.instructions,
          duration: activity.duration,
          materials: activity.materials,
          intelligences: activity.intelligences,
          parentTip: activity.parentTip,
          extensionIdeas: activity.extensionIdeas,
          mechanismTags: activity.mechanismTags,
          goalPillars: activity.goalPillars,
          whyAIAge: activity.whyAIAge,
          contraindications: activity.contraindications,
        })),
      }),
    });
    if (!res.ok) {
      cachePrintableGuide(req, fallback);
      return fallback;
    }
    const json = await res.json() as { success?: boolean; guide?: PrintableGuide };
    const guide = json.guide ?? fallback;
    cachePrintableGuide(req, guide);
    return guide;
  } catch {
    cachePrintableGuide(req, fallback);
    return fallback;
  }
}

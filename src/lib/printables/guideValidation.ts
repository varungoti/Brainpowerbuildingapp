import { buildPrintableGuideFallback } from "./guideFallback";
import type { PrintableGuide, PrintableGuideActivity, PrintableGuideRequest } from "./guideTypes";

/** The same explicit projection is used for the request body and cache identity. */
export function printableGuidePayload(req: PrintableGuideRequest) {
  return {
    childName: req.childName,
    childAge: req.childAge,
    ageTier: req.ageTier,
    mood: req.mood,
    includeImages: req.includeImages !== false,
    activities: req.activities.map(activity => ({
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
  };
}

export function printableGuideRequestIdentity(req: PrintableGuideRequest): string {
  return JSON.stringify(printableGuidePayload(req));
}

export function isPrintableRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function optionalText(value: unknown): value is string | undefined {
  return value === undefined || text(value);
}

function validActivity(value: unknown): value is PrintableGuideActivity {
  if (!isPrintableRecord(value) || !isPrintableRecord(value.illustration)) return false;
  return ["activityId", "title", "region", "whyThisMatters", "adaptIfTooEasy", "adaptIfTooHard", "safetyNote", "reflectionPrompt"]
    .every(key => text(value[key]))
    && typeof value.duration === "number" && Number.isFinite(value.duration) && value.duration >= 0
    && [value.intelligences, value.materials, value.steps, value.sayThis, value.watchFor].every(strings)
    && [value.illustration.prompt, value.illustration.alt, value.illustration.fallbackIcon].every(text)
    && [value.illustration.url, value.illustration.provider, value.illustration.model].every(optionalText);
}

function displayImageUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) return value;
  try {
    const url = new URL(value);
    if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) return value;
  } catch {
    // Invalid or unsupported image locations keep the existing icon fallback.
  }
  return undefined;
}

/** Validate untrusted JSON, then bind authored content to this exact request. */
export function validatePrintableGuide(value: unknown, req: PrintableGuideRequest): PrintableGuide | null {
  if (!isPrintableRecord(value) || !isPrintableRecord(value.routine)) return null;
  if (!["id", "title", "subtitle", "childName", "packHash", "footer", "generatedAt"].every(key => text(value[key]))) return null;
  if (!Number.isFinite(Date.parse(value.generatedAt as string))) return null;
  if (![value.materials, value.prepChecklist].every(strings)) return null;
  if (!["warmUp", "mainPlay", "calmClose", "parentReflection"].every(key => text((value.routine as Record<string, unknown>)[key]))) return null;
  if (![value.provider, value.model].every(optionalText)) return null;
  if (!Array.isArray(value.activities) || !value.activities.every(validActivity)) return null;

  const fallback = buildPrintableGuideFallback(req);
  if (value.id !== fallback.id || value.packHash !== fallback.packHash
    || value.childName !== fallback.childName || value.childAge !== fallback.childAge
    || value.ageTier !== fallback.ageTier || value.totalMinutes !== fallback.totalMinutes
    || value.activities.length !== fallback.activities.length) return null;

  const activities: PrintableGuideActivity[] = [];
  for (let i = 0; i < fallback.activities.length; i++) {
    const authored = fallback.activities[i];
    const incoming = value.activities[i];
    if (incoming.activityId !== authored.activityId || incoming.duration !== authored.duration) return null;
    activities.push({
      ...authored,
      materials: [...authored.materials],
      intelligences: [...authored.intelligences],
      // Generated text may enrich the card, but cannot replace its steps,
      // materials, identity or authored safety instructions.
      whyThisMatters: incoming.whyThisMatters,
      sayThis: [...incoming.sayThis],
      watchFor: [...incoming.watchFor],
      adaptIfTooEasy: incoming.adaptIfTooEasy,
      adaptIfTooHard: incoming.adaptIfTooHard,
      reflectionPrompt: incoming.reflectionPrompt,
      illustration: {
        prompt: incoming.illustration.prompt,
        alt: incoming.illustration.alt,
        fallbackIcon: authored.illustration.fallbackIcon,
        url: req.includeImages === false ? undefined : displayImageUrl(incoming.illustration.url),
        provider: incoming.illustration.provider,
        model: incoming.illustration.model,
      },
    });
  }
  return {
    ...fallback,
    activities,
    // Keep the request-derived title, routine, prep, materials and disclaimer.
    generatedAt: value.generatedAt as string,
    provider: value.provider as string | undefined,
    model: value.model as string | undefined,
  };
}

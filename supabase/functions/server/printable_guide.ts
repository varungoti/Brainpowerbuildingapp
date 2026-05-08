import { chatJson, generateImage } from "./ai_provider.ts";
import { printableGuideSchema } from "./ai_schemas.ts";

type PrintableActivity = {
  id: string;
  name: string;
  emoji?: string;
  region?: string;
  description?: string;
  instructions?: string[];
  duration?: number;
  materials?: string[];
  intelligences?: string[];
  parentTip?: string;
  extensionIdeas?: string[];
  mechanismTags?: string[];
  goalPillars?: string[];
  whyAIAge?: string;
  contraindications?: string[];
};

export type PrintableGuidePayload = {
  childName?: string;
  childAge?: number;
  ageTier?: number;
  mood?: string;
  includeImages?: boolean;
  activities?: PrintableActivity[];
};

function uniq(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function hashActivities(activities: PrintableActivity[]): string {
  const raw = activities.map((a) => `${a.id}:${a.name}:${a.duration ?? 0}`).join("|");
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function fallbackActivity(activity: PrintableActivity) {
  const materials = activity.materials?.length ? activity.materials : ["No special materials"];
  const intelligence = activity.intelligences?.[0] ?? "whole-child development";
  return {
    activityId: activity.id,
    title: activity.name,
    duration: activity.duration ?? 10,
    region: activity.region ?? "Global",
    intelligences: activity.intelligences ?? [],
    materials,
    whyThisMatters: activity.whyAIAge ?? activity.parentTip ?? activity.description ?? `This builds ${intelligence} through play.`,
    steps: activity.instructions?.slice(0, 7) ?? ["Invite your child to try the activity.", "Model once, then let them lead."],
    sayThis: ["Let's try this together.", "What do you notice?", "I like how you kept trying."],
    watchFor: ["Curiosity", "Persistence", "Need for a simpler next step"],
    adaptIfTooEasy: activity.extensionIdeas?.[0] ?? "Add one extra rule or longer sequence.",
    adaptIfTooHard: "Use fewer steps, model once, and keep the tone playful.",
    safetyNote: activity.contraindications?.[0] ?? "Supervise closely and use safe household materials.",
    reflectionPrompt: "What helped your child stay engaged today?",
    illustration: {
      prompt: `Child-safe illustration of a parent and child doing ${activity.name} with ${materials.join(", ")}. Bright, warm, no text, supervised household play.`,
      alt: `Parent and child doing ${activity.name}`,
      fallbackIcon: activity.emoji ?? "sparkle",
    },
  };
}

export function buildPrintableGuideFallback(payload: PrintableGuidePayload) {
  const activities = (payload.activities ?? []).slice(0, 8);
  const childName = (payload.childName ?? "your child").trim() || "your child";
  const packHash = hashActivities(activities);
  const guideActivities = activities.map(fallbackActivity);
  return {
    id: `printable-${packHash}`,
    title: `${childName}'s Daily Brain-Building Guide`,
    subtitle: `${guideActivities.length} activities · ${guideActivities.reduce((sum, a) => sum + a.duration, 0)} minutes · Tier ${payload.ageTier ?? 1}`,
    childName,
    childAge: typeof payload.childAge === "number" ? payload.childAge : undefined,
    ageTier: payload.ageTier ?? 1,
    totalMinutes: guideActivities.reduce((sum, a) => sum + a.duration, 0),
    materials: uniq(guideActivities.flatMap((a) => a.materials)),
    prepChecklist: [
      "Choose a safe, calm space and stay close enough to supervise.",
      "Gather materials first so the activity feels smooth.",
      "Use the parent script as a starting point, not a performance.",
      "Pause or simplify if your child seems tired or overwhelmed.",
    ],
    activities: guideActivities,
    routine: {
      warmUp: "Start with a one-minute connection ritual: smile, breathe, and invite your child in.",
      mainPlay: "Move through the cards in order, but let your child's interest set the pace.",
      calmClose: "End with specific praise about effort, curiosity, or kindness.",
      parentReflection: "Write one small observation to guide tomorrow's play.",
    },
    footer: "NeuroSpark guidance is educational support, not diagnosis or medical advice. Supervise children and adapt every activity to your home context.",
    generatedAt: new Date().toISOString(),
    provider: "fallback",
    model: "deterministic",
    packHash,
  };
}

function normalizeGuide(value: Record<string, unknown>, fallback: ReturnType<typeof buildPrintableGuideFallback>) {
  return {
    ...fallback,
    ...value,
    id: fallback.id,
    childName: fallback.childName,
    childAge: fallback.childAge,
    ageTier: fallback.ageTier,
    totalMinutes: fallback.totalMinutes,
    packHash: fallback.packHash,
    materials: Array.isArray(value.materials) ? value.materials.filter((x): x is string => typeof x === "string") : fallback.materials,
    prepChecklist: Array.isArray(value.prepChecklist)
      ? value.prepChecklist.filter((x): x is string => typeof x === "string")
      : fallback.prepChecklist,
    activities: Array.isArray(value.activities) && value.activities.length
      ? value.activities.map((activity, i) => ({
          ...fallback.activities[i % fallback.activities.length],
          ...(activity && typeof activity === "object" ? activity as Record<string, unknown> : {}),
        }))
      : fallback.activities,
    routine: value.routine && typeof value.routine === "object"
      ? { ...fallback.routine, ...(value.routine as Record<string, string>) }
      : fallback.routine,
    footer: typeof value.footer === "string" ? value.footer : fallback.footer,
  };
}

export async function generatePrintableGuide(payload: PrintableGuidePayload) {
  const fallback = buildPrintableGuideFallback(payload);
  if (!payload.activities?.length) return fallback;

  const prompt = [
    "Create a polished, printable NeuroSpark parent guide for today's child development activity pack.",
    `Child: ${fallback.childName}, age ${fallback.childAge ?? "unknown"}, tier ${fallback.ageTier}, mood ${payload.mood ?? "not specified"}.`,
    "Standards: colourful but print-safe, parent-first, step-by-step, warm, no diagnosis, no unsupported claims.",
    "Each activity needs practical steps, what to say, what to watch for, adaptations, safety note, reflection prompt, and child-safe illustration prompt.",
    "Activities:",
    JSON.stringify(payload.activities, null, 2).slice(0, 9000),
  ].join("\n\n");

  const generated = await chatJson<Record<string, unknown>>({
    route: "printable-guide",
    quality: "quality",
    schemaName: "PrintableGuide",
    schema: printableGuideSchema,
    temperature: 0.45,
    maxTokens: 3600,
    messages: [
      { role: "system", content: "You design beautiful, safe, practical printable parent guides for child-development play." },
      { role: "user", content: prompt },
    ],
  });

  const guide = generated
    ? normalizeGuide(generated.data, fallback)
    : fallback;

  if (generated) {
    guide.provider = generated.provider;
    guide.model = generated.model;
  }

  if (payload.includeImages !== false) {
    guide.activities = await Promise.all(guide.activities.map(async (activity) => {
      const image = await generateImage({
        route: "printable-image",
        prompt: `${activity.illustration.prompt} NeuroSpark style, soft vector illustration, no text, child-safe, parent supervising.`,
        aspectRatio: "4:3",
        steps: 4,
      });
      const svcImage = image ? null : await generateViaImageSvc(activity.illustration.prompt).catch(() => null);
      if (image) {
        return {
          ...activity,
          illustration: {
            ...activity.illustration,
            url: image.url,
            provider: image.provider,
            model: image.model,
          },
        };
      }
      if (svcImage) {
        return {
          ...activity,
          illustration: {
            ...activity.illustration,
            url: svcImage.url,
            provider: svcImage.provider,
            model: "image-svc",
          },
        };
      }
      return activity;
    }));
  }

  return guide;
}

async function generateViaImageSvc(prompt: string): Promise<{ url: string; provider: string } | null> {
  const base = Deno.env.get("IMAGE_SVC_URL");
  const token = Deno.env.get("IMAGE_SVC_TOKEN");
  if (!base || !token) return null;
  const res = await fetch(`${base.replace(/\/+$/, "")}/v1/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      providerId: "fireworks_flux_schnell",
      spec: {
        prompt,
        aspect: "4:3",
        size: 1024,
        style: "soft vector printable parent guide",
      },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { url?: string; provider?: string };
  return data.url ? { url: data.url, provider: data.provider ?? "image-svc" } : null;
}

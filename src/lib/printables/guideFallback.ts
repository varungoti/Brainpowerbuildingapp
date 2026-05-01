import type { Activity } from "../../app/data/activities";
import type { PrintableGuide, PrintableGuideActivity, PrintableGuideRequest } from "./guideTypes";

export function hashPrintablePack(activities: Pick<Activity, "id" | "name" | "duration">[]): string {
  const raw = activities.map((activity) => `${activity.id}:${activity.name}:${activity.duration}`).join("|");
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function uniq(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function sentence(value: string, fallback: string): string {
  const clean = value.trim();
  if (!clean) return fallback;
  return clean.endsWith(".") || clean.endsWith("!") || clean.endsWith("?") ? clean : `${clean}.`;
}

function firstIntelligence(activity: Activity): string {
  return activity.intelligences[0] ?? "whole-child development";
}

export function buildPrintableActivityFallback(activity: Activity): PrintableGuideActivity {
  const core = firstIntelligence(activity);
  const materials = activity.materials.length ? activity.materials : ["No special materials"];
  return {
    activityId: activity.id,
    title: activity.name,
    duration: activity.duration,
    region: activity.region,
    intelligences: activity.intelligences,
    materials,
    whyThisMatters: sentence(
      activity.whyAIAge ?? activity.parentTip ?? activity.description,
      `This activity builds ${core} through parent-guided play.`,
    ),
    steps: activity.instructions.slice(0, 7),
    sayThis: [
      `Let's try ${activity.name} together.`,
      "Show me your idea first, then I'll help if you want.",
      "What changed when we tried it this way?",
    ],
    watchFor: [
      `Engagement with ${core.toLowerCase()} practice`,
      "Whether your child needs more movement, fewer steps, or a calmer pace",
      "Moments of persistence, curiosity, or self-correction",
    ],
    adaptIfTooEasy: activity.extensionIdeas?.[0] ?? "Add one extra rule, longer sequence, or a child-led variation.",
    adaptIfTooHard: "Reduce to the first two steps, model once, and celebrate any attempt.",
    safetyNote: activity.contraindications?.[0] ?? "Supervise closely and use only safe household materials.",
    reflectionPrompt: "What felt easiest, what felt tricky, and what should we try next time?",
    illustration: {
      prompt: [
        `Bright, uncluttered parent-child illustration for "${activity.name}".`,
        `Show supervised household play using: ${materials.join(", ")}.`,
        "Warm NeuroSpark style, no text in image, safe setup, no medical imagery.",
      ].join(" "),
      alt: `Parent guiding child through ${activity.name}`,
      fallbackIcon: activity.emoji,
    },
  };
}

export function buildPrintableGuideFallback(req: PrintableGuideRequest): PrintableGuide {
  const totalMinutes = req.activities.reduce((sum, activity) => sum + activity.duration, 0);
  const materials = uniq(req.activities.flatMap((activity) => activity.materials));
  const packHash = hashPrintablePack(req.activities);
  const child = req.childName.trim() || "your child";
  return {
    id: `printable-${packHash}`,
    title: `${child}'s Daily Brain-Building Guide`,
    subtitle: `${req.activities.length} parent-led activities · ${totalMinutes} minutes · Tier ${req.ageTier}`,
    childName: child,
    childAge: req.childAge,
    ageTier: req.ageTier,
    totalMinutes,
    materials: materials.length ? materials : ["No special materials"],
    prepChecklist: [
      "Pick a calm, safe space where you can supervise closely.",
      "Gather materials before inviting your child in.",
      "Read the parent script once, then keep the activity playful.",
      "Stop early if your child is tired, overwhelmed, or unsafe.",
    ],
    activities: req.activities.map(buildPrintableActivityFallback),
    routine: {
      warmUp: "Start with one minute of connection: eye contact, a smile, and a simple invitation.",
      mainPlay: "Run the activities in order, but follow your child's attention and energy.",
      calmClose: "Close with one specific praise: name the effort you noticed.",
      parentReflection: "Write one sentence: what helped my child stay engaged today?",
    },
    footer: "NeuroSpark guidance is educational support, not diagnosis or medical advice. Supervise children and adapt every activity to your home context.",
    generatedAt: new Date().toISOString(),
    provider: "fallback",
    model: "deterministic",
    packHash,
  };
}

export function normalizePrintableGuide(value: Partial<PrintableGuide>, fallback: PrintableGuide): PrintableGuide {
  return {
    ...fallback,
    ...value,
    title: typeof value.title === "string" ? value.title : fallback.title,
    subtitle: typeof value.subtitle === "string" ? value.subtitle : fallback.subtitle,
    materials: Array.isArray(value.materials) ? value.materials.filter((x): x is string => typeof x === "string") : fallback.materials,
    prepChecklist: Array.isArray(value.prepChecklist) ? value.prepChecklist.filter((x): x is string => typeof x === "string") : fallback.prepChecklist,
    activities: Array.isArray(value.activities) && value.activities.length > 0
      ? value.activities.map((activity, i) => ({ ...fallback.activities[i % fallback.activities.length], ...activity }))
      : fallback.activities,
    routine: value.routine && typeof value.routine === "object" ? { ...fallback.routine, ...value.routine } : fallback.routine,
    footer: typeof value.footer === "string" ? value.footer : fallback.footer,
    generatedAt: value.generatedAt ?? fallback.generatedAt,
    packHash: fallback.packHash,
  };
}

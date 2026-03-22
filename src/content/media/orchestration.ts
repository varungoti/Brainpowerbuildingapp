import type { Activity } from "../../app/data/activities";

export type MediaAssetKind = "image" | "audio" | "video";

export interface MediaPromptPacket {
  kind: MediaAssetKind;
  slug: string;
  title: string;
  goal: string;
  audience: string;
  evidenceAnchors: string[];
  safetyConstraints: string[];
  formatNotes: string[];
  prompt: string;
}

function ageStageNotes(activity: Activity): string {
  const youngest = Math.min(...activity.ageTiers);
  const oldest = Math.max(...activity.ageTiers);
  return `Designed for NeuroSpark tiers ${youngest}-${oldest}. Keep instructions developmentally simple, parent-led, and household-material friendly.`;
}

function formatNotesFor(kind: MediaAssetKind): string[] {
  if (kind === "image") return ["Bright but uncluttered composition", "Show one clear parent-child interaction moment", "Avoid extra materials not listed in the activity"];
  if (kind === "audio") return ["Warm, calm narration voice", "Short phrases with natural pauses", "Keep cue timing aligned to real parent facilitation"];
  return ["Scene list should fit a 30-60 second explainer", "Each shot must visually reinforce the developmental mechanism", "No overstimulating cuts or unsafe setups"];
}

export function buildMediaPromptPacket(activity: Activity, kind: MediaAssetKind): MediaPromptPacket {
  const evidenceAnchors = [
    `Mechanisms: ${(activity.mechanismTags ?? []).join(", ") || "developmental play"}`,
    `Goal pillars: ${(activity.goalPillars ?? []).join(", ") || "general development"}`,
    `Milestone links: ${(activity.milestoneIds ?? []).join(", ") || "none explicitly linked"}`,
  ];
  const safetyConstraints = [
    "Do not show children unsupervised.",
    "Do not introduce materials beyond the reviewed activity inventory.",
    ...(activity.contraindications ?? []),
  ];
  const formatNotes = formatNotesFor(kind);
  const prompt = [
    `Create a ${kind} asset for the NeuroSpark activity "${activity.name}".`,
    `Objective: Help a parent understand how to run the activity and why it matters.`,
    `Activity summary: ${activity.description}`,
    `Parent tip: ${activity.parentTip}`,
    `Instructions: ${activity.instructions.join(" | ")}`,
    `Materials: ${activity.materials.join(", ") || "none"}`,
    `Age guidance: ${ageStageNotes(activity)}`,
    `Research anchors: ${evidenceAnchors.join(" | ")}`,
    `Safety constraints: ${safetyConstraints.join(" | ")}`,
    `Format notes: ${formatNotes.join(" | ")}`,
    `Tone: high-trust, evidence-aligned, household-realistic, emotionally warm, non-hype.`,
  ].join("\n");

  return {
    kind,
    slug: `${activity.id}-${kind}`,
    title: `${activity.name} ${kind} prompt`,
    goal: "Translate reviewed activity content into prompt-ready media instructions.",
    audience: "Parents and caregivers of children aged 1-10 using NeuroSpark at home.",
    evidenceAnchors,
    safetyConstraints,
    formatNotes,
    prompt,
  };
}

export function buildActivityEditorialChecklist(activity: Activity): string[] {
  return [
    "Confirm the activity has a reviewed status before media generation.",
    "Verify the mechanism tags still match the developmental goal.",
    "Check milestone links and goal pillars for age appropriateness.",
    "Ensure materials and contraindications are visible in the final asset brief.",
    `Respect activity duration variants: quick ${activity.durationVariants?.quick ?? activity.duration}m / standard ${activity.duration}m / stretch ${activity.durationVariants?.stretch ?? activity.duration + 5}m.`,
  ];
}

import type { Activity } from "../../app/data/activities";

export function buildActivityNarration(activity: Activity, childName?: string): string {
  const greeting = childName
    ? `Hey ${childName}! Let's do a fun activity called ${activity.name}.`
    : `Let's do a fun activity called ${activity.name}.`;

  const description = activity.description;

  const materialsIntro = activity.materials.length > 0
    ? `First, let's gather our materials. We'll need: ${activity.materials.join(", ")}.`
    : "No special materials needed for this one!";

  const steps = activity.instructions.map((step, i) =>
    `Step ${i + 1}: ${step}`
  ).join(". ");

  const tip = activity.parentTip
    ? `Here's a tip for the grown-up: ${activity.parentTip}`
    : "";

  const closing = `Great job! This activity helps build ${activity.intelligences.join(" and ")} intelligence.`;

  return [greeting, description, materialsIntro, steps, tip, closing]
    .filter(Boolean)
    .join(" ... ");
}

export function buildStepNarration(step: string, stepNumber: number): string {
  return `Step ${stepNumber}: ${step}`;
}

export function buildCompletionNarration(activityName: string, childName?: string): string {
  const who = childName ?? "you";
  return `Amazing work, ${who}! You completed ${activityName}. Give yourself a big pat on the back!`;
}

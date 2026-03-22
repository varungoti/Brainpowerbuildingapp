import type { Activity, AGEPersonalization } from "./activities";
import { SKILL_TAG_AI_LITERACY, SKILL_TAG_DUAL_TASK } from "./activities";

export interface WhyPickedContext {
  childName: string;
  tier: number;
  mood: string;
  personalization: AGEPersonalization | null;
  /** Latest completion ms per activity id (non-null when child has history) */
  lastCompletionByActivity: Record<string, number> | null;
  recentActivityIds: string[];
}

/** 2–4 short parent-facing lines (no medical claims). */
export function buildWhyPickedLines(act: Activity, ctx: WhyPickedContext): string[] {
  const lines: string[] = [];
  const { personalization: p, lastCompletionByActivity: lastMap, mood, childName, tier, recentActivityIds } = ctx;

  if (act.moodTags?.includes(mood)) {
    lines.push(`Fits today's "${mood}" mood — chosen to match energy and focus.`);
  }

  if (act.skillTags?.includes(SKILL_TAG_AI_LITERACY)) {
    lines.push(`Human + tools literacy: practice verifying ideas and clear instructions — no extra screen time required.`);
  }
  if (act.skillTags?.includes(SKILL_TAG_DUAL_TASK)) {
    lines.push(`Dual-task friendly: combines movement or rhythm with thinking — supports motor–cognition coupling.`);
  }

  if (p) {
    if (p.learningStyle === "visual" && (act.intelligences.includes("Spatial-Visual") || act.intelligences.includes("Creative"))) {
      lines.push(`Lines up with ${childName}'s visual learning style.`);
    }
    if (p.learningStyle === "auditory" && (act.intelligences.includes("Linguistic") || act.intelligences.includes("Musical-Rhythmic"))) {
      lines.push(`Uses listening and language — strong match for an auditory learner.`);
    }
    if (p.learningStyle === "kinesthetic" && act.intelligences.includes("Bodily-Kinesthetic")) {
      lines.push(`Movement and hands-on work — fits their kinesthetic style.`);
    }
    if (p.patience <= 4 && act.duration <= 12) {
      lines.push(`Short ${act.duration}-minute format — easier when attention runs shorter.`);
    }
    if (p.sensitivity >= 7 && (act.moodTags?.includes("calm") || act.moodTags?.includes("low") || act.difficulty <= 2)) {
      lines.push(`Gentle difficulty and calming tags — considerate of sensitivity.`);
    }
    if (p.creativity >= 7 && act.intelligences.includes("Creative")) {
      lines.push(`Supports the creative spark you're seeing.`);
    }
    if (p.social >= 7 && (act.intelligences.includes("Interpersonal") || act.intelligences.includes("Emotional"))) {
      lines.push(`Builds social-emotional skills in line with your profile.`);
    }
  }

  const ts = lastMap?.[act.id];
  if (ts) {
    const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    if (days >= 3 && days < 14) {
      lines.push(`Spaced repetition: last done ~${Math.round(days)} days ago — good window to revisit.`);
    } else if (days >= 14) {
      lines.push(`Hasn't come up in ${Math.round(days)}+ days — refreshes variety.`);
    }
  } else if (lastMap && Object.keys(lastMap).length > 0) {
    lines.push(`Fresh in ${childName}'s recent log — broadens what they've practiced.`);
  }

  if (!recentActivityIds.includes(act.id)) {
    lines.push(`Not in the last few sessions — extra variety.`);
  }

  const primary = act.intelligences[0] ?? "multiple areas";
  lines.push(`Tier ${tier} fit · emphasizes ${primary.split("-")[0]} · ${act.method} (${act.region}).`);

  // Dedupe while preserving order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const L of lines) {
    if (!seen.has(L)) {
      seen.add(L);
      out.push(L);
    }
  }
  return out.slice(0, 4);
}

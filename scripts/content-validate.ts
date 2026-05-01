import { ACTIVITIES } from "../src/app/data/activities";
import { buildActivityEditorialChecklist, buildMediaPromptPacket } from "../src/content/media/orchestration";
import { buildPrintableGuideFallback } from "../src/lib/printables/guideFallback";

const failures: string[] = [];

for (const activity of ACTIVITIES) {
  if (activity.reviewStatus !== "reviewed") failures.push(`${activity.id}: reviewStatus missing`);
  if (!activity.goalPillars?.length) failures.push(`${activity.id}: goalPillars missing`);
  if (!activity.mechanismTags?.length) failures.push(`${activity.id}: mechanismTags missing`);
  if (!activity.durationVariants) failures.push(`${activity.id}: durationVariants missing`);
  if (!activity.progression?.programId) failures.push(`${activity.id}: progression missing`);

  for (const kind of ["image", "audio", "video"] as const) {
    const packet = buildMediaPromptPacket(activity, kind);
    if (!packet.prompt.includes("Safety constraints:")) failures.push(`${activity.id}: ${kind} prompt missing safety section`);
    if (!packet.prompt.includes("Research anchors:")) failures.push(`${activity.id}: ${kind} prompt missing research anchors`);
  }

  const checklist = buildActivityEditorialChecklist(activity);
  if (checklist.length < 4) failures.push(`${activity.id}: editorial checklist too short`);
}

const printable = buildPrintableGuideFallback({
  childName: "Sample child",
  ageTier: 3,
  activities: ACTIVITIES.slice(0, 3),
});

if (!printable.footer.toLowerCase().includes("not diagnosis")) failures.push("printable: footer missing non-diagnosis guardrail");
for (const card of printable.activities) {
  if (!card.safetyNote) failures.push(`printable ${card.activityId}: safety note missing`);
  if (!card.whyThisMatters) failures.push(`printable ${card.activityId}: research/why section missing`);
  if (card.materials.length === 0) failures.push(`printable ${card.activityId}: materials missing`);
  if (!card.illustration.prompt.toLowerCase().includes("child-safe") && !card.illustration.prompt.toLowerCase().includes("safe")) {
    failures.push(`printable ${card.activityId}: illustration prompt missing safety language`);
  }
}

if (failures.length > 0) {
  console.error("Content validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Content validation passed for ${ACTIVITIES.length} reviewed activities.`);

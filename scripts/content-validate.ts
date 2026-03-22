import { ACTIVITIES } from "../src/app/data/activities";
import { buildActivityEditorialChecklist, buildMediaPromptPacket } from "../src/content/media/orchestration";

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

if (failures.length > 0) {
  console.error("Content validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Content validation passed for ${ACTIVITIES.length} reviewed activities.`);

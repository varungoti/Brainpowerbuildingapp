import type { Activity } from "../../app/data/activities";

export function autoTagFromActivity(activity: Activity): string[] {
  const tags = new Set<string>();

  for (const intel of activity.intelligences) tags.add(intel);
  if (activity.region) tags.add(activity.region);
  if (activity.moodTags) for (const t of activity.moodTags) tags.add(t);
  if (activity.skillTags) for (const t of activity.skillTags) tags.add(t);
  if (activity.seasonalTags) for (const t of activity.seasonalTags) tags.add(t);

  return [...tags];
}

export function suggestCaption(activity: Activity, childName?: string): string {
  const who = childName ? `${childName}'s` : "My";
  return `${who} ${activity.name} creation (${activity.intelligences.join(", ")})`;
}

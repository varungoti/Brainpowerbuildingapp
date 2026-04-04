import type { ChildProfile } from "../../app/context/AppContext";
import type { Activity } from "../../app/data/activities";

export interface SiblingPack {
  activity: Activity;
  roles: Record<string, string>;
  adaptedInstructions: Record<string, string[]>;
}

function ageTierGap(a: ChildProfile, b: ChildProfile): number {
  return Math.abs(a.ageTier - b.ageTier);
}

export function canCollaborate(children: ChildProfile[], activity: Activity): boolean {
  if (children.length < 2) return false;
  if (!activity.collaborationType) {
    return activity.ageTiers.length > 1;
  }
  const tiers = new Set(children.map(c => c.ageTier));
  return activity.ageTiers.some(t => tiers.has(t));
}

export function matchActivities(
  children: ChildProfile[],
  activities: Activity[],
  limit = 5,
): SiblingPack[] {
  if (children.length < 2) return [];

  const youngest = children.reduce((a, b) => a.ageTier < b.ageTier ? a : b);
  const oldest = children.reduce((a, b) => a.ageTier > b.ageTier ? a : b);
  const gap = ageTierGap(youngest, oldest);

  const eligible = activities.filter(a => {
    if (a.collaborationType) return canCollaborate(children, a);
    if (a.ageTiers.length <= 1 && gap > 1) return false;
    return children.every(c => a.ageTiers.includes(c.ageTier));
  });

  const scored = eligible.map(a => {
    let score = 50;
    if (a.collaborationType) score += 20;
    if (a.siblingRoles) score += 15;
    if (a.intelligences.length >= 2) score += 10;
    const tierCoverage = children.filter(c => a.ageTiers.includes(c.ageTier)).length;
    score += tierCoverage * 8;
    score += Math.random() * 10;
    return { activity: a, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ activity }) => {
    const roles: Record<string, string> = {};
    const adaptedInstructions: Record<string, string[]> = {};

    for (const child of children) {
      if (activity.siblingRoles) {
        roles[child.id] = child.ageTier <= youngest.ageTier
          ? activity.siblingRoles.younger
          : activity.siblingRoles.older;
      } else {
        roles[child.id] = child.ageTier <= youngest.ageTier ? "helper" : "leader";
      }
      adaptedInstructions[child.id] = activity.instructions;
    }

    return { activity, roles, adaptedInstructions };
  });
}

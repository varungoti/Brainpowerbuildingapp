export type CaregiverRole = "primary" | "caregiver" | "observer";

export interface CaregiverLink {
  id: string;
  userId: string;
  childId: string;
  role: CaregiverRole;
  invitedBy: string;
  acceptedAt?: string;
  displayName: string;
  email: string;
}

export function canLogActivities(role: CaregiverRole): boolean {
  return role === "primary" || role === "caregiver";
}

export function canEditProfile(role: CaregiverRole): boolean {
  return role === "primary";
}

export function canManageCaregivers(role: CaregiverRole): boolean {
  return role === "primary";
}

export function canDeleteData(role: CaregiverRole): boolean {
  return role === "primary";
}

export function generateInviteCode(childId: string, inviterId: string): string {
  const payload = `${childId}:${inviterId}:${Date.now()}`;
  return btoa(payload).replace(/[+/=]/g, (c) =>
    c === "+" ? "-" : c === "/" ? "_" : ""
  );
}

export function parseInviteCode(code: string): { childId: string; inviterId: string } | null {
  try {
    const padded = code.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(padded);
    const [childId, inviterId] = decoded.split(":");
    if (!childId || !inviterId) return null;
    return { childId, inviterId };
  } catch {
    return null;
  }
}

export const ROLE_LABELS: Record<CaregiverRole, { label: string; emoji: string; desc: string }> = {
  primary: { label: "Primary", emoji: "👑", desc: "Full access — manage everything" },
  caregiver: { label: "Caregiver", emoji: "🤝", desc: "View data and log activities" },
  observer: { label: "Observer", emoji: "👁️", desc: "View-only access" },
};

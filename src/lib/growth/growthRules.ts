export type AdminRole = "superadmin" | "analyst" | "marketing" | "support" | "readonly";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested" | "expired";

export type ApprovalDecision = "approve" | "reject" | "changes";

export type OkrStatus =
  | "planned"
  | "in_progress"
  | "missed"
  | "base_hit"
  | "stretch_hit"
  | "overachieved"
  | "cancelled";

export interface ReadinessInput {
  score: number;
  p0Open: number;
  p1Open: number;
}

export interface KillSwitchInput {
  enabled: boolean;
}

const ROLE_RANK: Record<AdminRole, number> = {
  readonly: 1,
  support: 2,
  marketing: 3,
  analyst: 4,
  superadmin: 5,
};

export function canAccessGrowthRoute(role: AdminRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK.marketing;
}

export function statusForOkrScore(score: number): OkrStatus {
  if (score >= 2) return "overachieved";
  if (score >= 1.5) return "stretch_hit";
  if (score >= 1) return "base_hit";
  return "missed";
}

export function approvalStatusForDecision(decision: ApprovalDecision): ApprovalStatus {
  if (decision === "approve") return "approved";
  if (decision === "reject") return "rejected";
  return "changes_requested";
}

export function canTransitionApproval(current: ApprovalStatus, decision: ApprovalDecision): boolean {
  if (current !== "pending") return false;
  return ["approve", "reject", "changes"].includes(decision);
}

export function maskSuppressionValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 3) return "*".repeat(trimmed.length);
  return trimmed.slice(0, 3).padEnd(trimmed.length, "*");
}

export function isLiveAutomationAllowed(readiness: ReadinessInput[], killSwitches: KillSwitchInput[]): boolean {
  if (readiness.length === 0) return false;
  if (killSwitches.some((item) => item.enabled)) return false;
  const average = Math.round(readiness.reduce((sum, item) => sum + item.score, 0) / readiness.length);
  return (
    average >= 90 &&
    readiness.every((item) => item.score >= 85 && item.p0Open === 0 && item.p1Open === 0)
  );
}

export type AdminRole = "superadmin" | "analyst" | "marketing" | "support" | "readonly";

export const ADMIN_ROLE_RANK: Record<AdminRole, number> = {
  readonly: 1,
  support: 2,
  marketing: 3,
  analyst: 4,
  superadmin: 5,
};

export function normaliseAdminRole(value: unknown): AdminRole | null {
  return typeof value === "string" && value in ADMIN_ROLE_RANK
    ? (value as AdminRole)
    : null;
}

export function canAccessAdminRole(role: AdminRole, minimum: AdminRole): boolean {
  return ADMIN_ROLE_RANK[role] >= ADMIN_ROLE_RANK[minimum];
}

export function parseBearerToken(header: string | null | undefined): string {
  const value = header ?? "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

export function buildAdminAuditRow(
  actor: { userId: string; email: string },
  action: string,
  payload?: Record<string, unknown> | null,
  target?: { type: string; id: string },
  requestMeta?: { forwardedFor?: string | null; userAgent?: string | null },
) {
  return {
    actor_id: actor.userId,
    actor_email: actor.email,
    action,
    target_type: target?.type ?? null,
    target_id: target?.id ?? null,
    payload: payload ?? null,
    ip: requestMeta?.forwardedFor?.split(",")[0]?.trim() || null,
    user_agent: requestMeta?.userAgent ?? null,
  };
}

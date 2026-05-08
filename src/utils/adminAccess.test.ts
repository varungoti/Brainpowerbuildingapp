import { describe, expect, it } from "vitest";
import {
  buildAdminAuditRow,
  canAccessAdminRole,
  normaliseAdminRole,
  parseBearerToken,
  type AdminRole,
} from "../../supabase/functions/server/admin_access";

describe("admin access helpers used by requireAdmin", () => {
  it("parses bearer tokens case-insensitively and rejects malformed headers", () => {
    expect(parseBearerToken("Bearer token-123")).toBe("token-123");
    expect(parseBearerToken("bearer   spaced-token  ")).toBe("spaced-token");
    expect(parseBearerToken("Token token-123")).toBe("");
    expect(parseBearerToken(null)).toBe("");
  });

  it("enforces the admin role hierarchy used by requireAdmin", () => {
    const matrix: Array<[AdminRole, AdminRole, boolean]> = [
      ["readonly", "readonly", true],
      ["support", "readonly", true],
      ["support", "analyst", false],
      ["marketing", "support", true],
      ["marketing", "analyst", false],
      ["analyst", "marketing", true],
      ["superadmin", "analyst", true],
    ];

    for (const [actual, minimum, allowed] of matrix) {
      expect(canAccessAdminRole(actual, minimum)).toBe(allowed);
    }
  });

  it("normalises persisted roles before the middleware trusts them", () => {
    expect(normaliseAdminRole("support")).toBe("support");
    expect(normaliseAdminRole("super_admin")).toBeNull();
    expect(normaliseAdminRole(null)).toBeNull();
  });

  it("builds the audit row inserted after mutating admin actions", () => {
    expect(
      buildAdminAuditRow(
        { userId: "admin-1", email: "ops@example.com" },
        "comp_premium",
        { months: 2, reason: "support recovery" },
        { type: "user", id: "user-1" },
        { forwardedFor: "203.0.113.10, 10.0.0.1", userAgent: "Playwright" },
      ),
    ).toEqual({
      actor_id: "admin-1",
      actor_email: "ops@example.com",
      action: "comp_premium",
      target_type: "user",
      target_id: "user-1",
      payload: { months: 2, reason: "support recovery" },
      ip: "203.0.113.10",
      user_agent: "Playwright",
    });
  });
});

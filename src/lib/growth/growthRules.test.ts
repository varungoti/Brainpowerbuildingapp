import { describe, expect, it } from "vitest";
import {
  approvalStatusForDecision,
  canAccessGrowthRoute,
  canTransitionApproval,
  isLiveAutomationAllowed,
  maskSuppressionValue,
  statusForOkrScore,
} from "./growthRules";

describe("growthRules", () => {
  it("maps OKR scores to base, stretch, and overachievement statuses", () => {
    expect(statusForOkrScore(0)).toBe("missed");
    expect(statusForOkrScore(0.9)).toBe("missed");
    expect(statusForOkrScore(1)).toBe("base_hit");
    expect(statusForOkrScore(1.5)).toBe("stretch_hit");
    expect(statusForOkrScore(2)).toBe("overachieved");
  });

  it("maps approval decisions to stable queue statuses", () => {
    expect(approvalStatusForDecision("approve")).toBe("approved");
    expect(approvalStatusForDecision("reject")).toBe("rejected");
    expect(approvalStatusForDecision("changes")).toBe("changes_requested");
  });

  it("allows approval transitions only from pending state", () => {
    expect(canTransitionApproval("pending", "approve")).toBe(true);
    expect(canTransitionApproval("pending", "reject")).toBe(true);
    expect(canTransitionApproval("pending", "changes")).toBe(true);
    expect(canTransitionApproval("approved", "reject")).toBe(false);
    expect(canTransitionApproval("expired", "approve")).toBe(false);
  });

  it("masks suppression values without exposing full emails or handles", () => {
    expect(maskSuppressionValue("a")).toBe("*");
    expect(maskSuppressionValue("abc")).toBe("***");
    expect(maskSuppressionValue("parent@example.com")).toBe("par***************");
  });

  it("restricts Growth Command Center access to marketing or higher roles", () => {
    expect(canAccessGrowthRoute("readonly")).toBe(false);
    expect(canAccessGrowthRoute("support")).toBe(false);
    expect(canAccessGrowthRoute("marketing")).toBe(true);
    expect(canAccessGrowthRoute("analyst")).toBe(true);
    expect(canAccessGrowthRoute("superadmin")).toBe(true);
  });

  it("blocks live automation unless readiness, P0/P1, and kill switches are clean", () => {
    const ready = [
      { score: 95, p0Open: 0, p1Open: 0 },
      { score: 90, p0Open: 0, p1Open: 0 },
      { score: 85, p0Open: 0, p1Open: 0 },
    ];
    expect(isLiveAutomationAllowed(ready, [{ enabled: false }])).toBe(true);
    expect(isLiveAutomationAllowed(ready, [{ enabled: true }])).toBe(false);
    expect(isLiveAutomationAllowed([{ score: 100, p0Open: 1, p1Open: 0 }], [])).toBe(false);
    expect(isLiveAutomationAllowed([{ score: 84, p0Open: 0, p1Open: 0 }], [])).toBe(false);
  });
});

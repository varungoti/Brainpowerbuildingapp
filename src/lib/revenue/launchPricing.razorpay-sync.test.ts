import { describe, expect, it } from "vitest";
import { LAUNCH_PAYWALL_PLANS, resolveLaunchPlanFromInr } from "./launchPricing";

/** Duplicates Edge `RAZORPAY_INR_WHITELIST` in `supabase/functions/server/index.tsx` — keep in sync. */
const EDGE_RAZORPAY_INR = [100, 600, 2000, 6999, 14999] as const;

describe("Razorpay INR whitelist parity", () => {
  it("matches LAUNCH_PAYWALL_PLANS priceInr set", () => {
    const fromLaunch = [...new Set(LAUNCH_PAYWALL_PLANS.map((p) => p.priceInr))].sort((a, b) => a - b);
    expect(fromLaunch).toEqual([...EDGE_RAZORPAY_INR]);
  });

  it("resolveLaunchPlanFromInr returns each plan", () => {
    for (const p of LAUNCH_PAYWALL_PLANS) {
      expect(resolveLaunchPlanFromInr(p.priceInr)?.id).toBe(p.id);
      expect(resolveLaunchPlanFromInr(p.priceInr)?.days).toBe(p.days);
    }
    expect(resolveLaunchPlanFromInr(999)).toBeNull();
  });
});

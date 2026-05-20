export type LaunchPlanId = "day1" | "day7" | "day30" | "premium_year" | "family_pro_year";

export interface LaunchPaywallPlan {
  id: LaunchPlanId;
  days: number;
  priceInr: number;
  pricePerDayInr: number;
  label: string;
  badge: string | null;
  color: string;
  offer: string;
  analyticsTier: "trial" | "monthly" | "annual" | "pro";
}

export const LAUNCH_PRICING_COPY = {
  globalPremiumMonthly: "$9.99/mo",
  globalPremiumAnnual: "$79/yr",
  familyProAnnual: "$199-$499/yr",
  indiaAnnualRange: "₹4,999-₹7,999/yr",
  partnerPilotRange: "$2,500-$10,000 pilot",
  partnerAnnualRange: "$10,000-$50,000/yr",
} as const;

export const LAUNCH_PAYWALL_PLANS: LaunchPaywallPlan[] = [
  {
    id: "day1",
    days: 1,
    priceInr: 100,
    pricePerDayInr: 100,
    label: "1 Day",
    badge: null,
    color: "#64748b",
    offer: "Try one personalised daily pack",
    analyticsTier: "trial",
  },
  {
    id: "day7",
    days: 7,
    priceInr: 600,
    pricePerDayInr: 86,
    label: "7 Days",
    badge: "Starter sprint",
    color: "#4361EE",
    offer: "Build the first weekly routine",
    analyticsTier: "monthly",
  },
  {
    id: "day30",
    days: 30,
    priceInr: 2000,
    pricePerDayInr: 67,
    label: "30 Days",
    badge: "Most Popular",
    color: "#7209B7",
    offer: "Full month of packs, printables, coach, and reports",
    analyticsTier: "monthly",
  },
  {
    id: "premium_year",
    days: 365,
    priceInr: 6999,
    pricePerDayInr: 19,
    label: "Family Premium Annual",
    badge: "Launch annual",
    color: "#F72585",
    offer: "Aligned with global $79/year launch pricing",
    analyticsTier: "annual",
  },
  {
    id: "family_pro_year",
    days: 365,
    priceInr: 14999,
    pricePerDayInr: 41,
    label: "Family Pro Annual",
    badge: "Growth engine",
    color: "#06D6A0",
    offer: "Printables, pediatrician snapshots, long-memory coach, and priority launches",
    analyticsTier: "pro",
  },
];

export function getLaunchPaywallPlan(planId: string): LaunchPaywallPlan {
  return LAUNCH_PAYWALL_PLANS.find((plan) => plan.id === planId) ?? LAUNCH_PAYWALL_PLANS[2];
}

/** INR amounts accepted by Edge `razorpay/create-order` — must match `RAZORPAY_INR_WHITELIST` in `supabase/functions/server/index.tsx`. */
export function resolveLaunchPlanFromInr(amountInr: number): LaunchPaywallPlan | null {
  return LAUNCH_PAYWALL_PLANS.find((plan) => plan.priceInr === amountInr) ?? null;
}

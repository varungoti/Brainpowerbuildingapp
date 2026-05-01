import { readFileSync } from "node:fs";

const checks: Array<{ name: string; pass: boolean; detail: string }> = [];

function read(path: string): string {
  return readFileSync(path, "utf8");
}

const paywall = read("src/app/screens/PaywallScreen.tsx");
const pricing = read("marketing-site/src/pages/pricing.astro");
const growthPage = read("admin/src/pages/growth/GrowthCommandCenterPage.tsx");
const growthMigration = read("supabase/migrations/00016_growth_command_center.sql");
const n8nGate = read("automation/n8n/workflows/lib/growth_approval_gate.json");
const mauticEnv = read("automation/mautic/.env.example");
const campaignSeeds = read("automation/growth-campaigns/seed-campaigns.json");
const weeklyReview = read("docs/growth/WEEKLY_REVIEW_TEMPLATE.md");
const mauticSegments = read("automation/mautic/segments-and-campaigns.json");
const hermesSchedules = read("automation/hermes/schedules.json");
const n8nMarketIntel = read("automation/n8n/workflows/growth_market_intelligence_dry_run.json");
const n8nMauticSync = read("automation/n8n/workflows/growth_mautic_sync_dry_run.json");
const growthRules = read("src/lib/growth/growthRules.ts");
const growthRulesTest = read("src/lib/growth/growthRules.test.ts");
const growthArtifactsTest = read("src/lib/growth/growthPlanArtifacts.test.ts");

checks.push({
  name: "App paywall uses shared launch pricing",
  pass: paywall.includes("LAUNCH_PAYWALL_PLANS") && paywall.includes("priceInr") && !paywall.includes("const PLANS ="),
  detail: "Paywall must not drift from shared launch pricing.",
});

checks.push({
  name: "Marketing pricing matches launch architecture",
  pass: pricing.includes("$9.99 / mo") && pricing.includes("$79 / yr") && pricing.includes("$2.5k-$10k pilot"),
  detail: "Marketing-site pricing must match the revenue plan offer ladder.",
});

checks.push({
  name: "Growth Command Center has manual controls",
  pass:
    growthPage.includes("Manual Growth Inputs") &&
    growthPage.includes("/admin/growth/suppression") &&
    growthPage.includes("/admin/growth/readiness") &&
    growthPage.includes("ICP Definitions") &&
    growthPage.includes("Revenue Source Tests"),
  detail: "Operators need UI controls for control-plane objects.",
});

checks.push({
  name: "Growth schema includes safety primitives",
  pass:
    growthMigration.includes("growth_approval_queue") &&
    growthMigration.includes("growth_kill_switches") &&
    growthMigration.includes("growth_compliance_suppression") &&
    growthMigration.includes("growth_readiness_scores") &&
    growthMigration.includes("growth_icp_definitions") &&
    growthMigration.includes("growth_revenue_sources"),
  detail: "Database must support approvals, kill switches, suppression, and readiness.",
});

checks.push({
  name: "n8n scaffold defaults to dry-run",
  pass: n8nGate.includes('"dryRun"') && n8nGate.includes('"value": true') && n8nGate.includes("blocked_until_integrated"),
  detail: "Automation workflows must not be live by default.",
});

checks.push({
  name: "Mautic scaffold keeps email sending disabled",
  pass: mauticEnv.includes("MAUTIC_EMAIL_SEND_ENABLED=false") && mauticEnv.includes("NS_GROWTH_REQUIRE_APPROVAL=true"),
  detail: "Email automation must stay disabled until production gates pass.",
});

checks.push({
  name: "First autonomous campaigns are seeded safely",
  pass: campaignSeeds.includes('"defaultMode": "dry_run"') && campaignSeeds.includes("Parent waitlist") && campaignSeeds.includes("Employer Family Benefit"),
  detail: "Initial growth campaigns must exist and default to dry run.",
});

checks.push({
  name: "Weekly growth review template exists",
  pass: weeklyReview.includes("Revenue collected") && weeklyReview.includes("Next Week OKRs") && weeklyReview.includes("Decision Log"),
  detail: "Founder handholding system needs a repeatable weekly review artifact.",
});

checks.push({
  name: "Mautic segments and templates are defined safely",
  pass: mauticSegments.includes('"emailSendEnabled": false') && mauticSegments.includes("starter_pack_7_day") && mauticSegments.includes("employer_benefit_sequence"),
  detail: "Mautic needs initial segments/templates without enabling sends.",
});

checks.push({
  name: "Hermes schedules are dry-run",
  pass: hermesSchedules.includes('"dryRun": true') && hermesSchedules.includes("daily_market_intelligence") && hermesSchedules.includes("weekly_growth_review"),
  detail: "Hermes must be scheduled as research/draft-only until approved.",
});

checks.push({
  name: "n8n growth workflow pack exists",
  pass: n8nMarketIntel.includes("growth_market_intelligence") && n8nMauticSync.includes("growth_mautic_sync") && n8nMauticSync.includes('"dryRun"'),
  detail: "n8n needs dry-run workflow scaffolds for market intel and Mautic sync.",
});

checks.push({
  name: "Plan phases are seeded into revenue checkpoints",
  pass: growthMigration.includes("Milestone: first $1k revenue") && growthMigration.includes("Milestone: $10M signed or collected revenue"),
  detail: "Revenue milestones should be visible in the Growth Command Center.",
});

checks.push({
  name: "Growth rules have unit coverage",
  pass:
    growthRules.includes("statusForOkrScore") &&
    growthRules.includes("maskSuppressionValue") &&
    growthRules.includes("canAccessGrowthRoute") &&
    growthRulesTest.includes("blocks live automation") &&
    growthRulesTest.includes("approval transitions"),
  detail: "Phase G requires tests for scoring, suppression, approval transitions, and permissions.",
});

checks.push({
  name: "Plan artifacts have regression coverage",
  pass:
    growthArtifactsTest.includes("first campaign seed pack") &&
    growthArtifactsTest.includes("growth n8n workflows") &&
    growthArtifactsTest.includes("Mautic and Hermes") &&
    growthArtifactsTest.includes("Growth Command Center schema"),
  detail: "The plan implementation should fail tests if critical growth assets disappear.",
});

const failed = checks.filter((check) => !check.pass);
for (const check of checks) {
  const prefix = check.pass ? "PASS" : "FAIL";
  console.log(`${prefix}: ${check.name} - ${check.detail}`);
}

if (failed.length) {
  process.exitCode = 1;
}

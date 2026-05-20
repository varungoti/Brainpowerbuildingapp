import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");
const readJson = <T>(path: string): T => JSON.parse(read(path)) as T;

describe("global revenue plan artifacts", () => {
  it("keeps the Growth Command Center production runbook aligned with shipped gates and Mission HQ", () => {
    const path = "docs/GROWTH_COMMAND_CENTER_PRODUCTION.md";
    expect(existsSync(path), `${path} should exist`).toBe(true);
    const body = read(path);
    expect(body.length, `${path} should not be trivially short`).toBeGreaterThan(800);
    expect(body).toContain("pnpm run growth:check");
    expect(body).toContain("00016_growth_command_center.sql");
    expect(body).toContain("00017_admin_mission_completions.sql");
    expect(body).toMatch(/Mission HQ|\/admin\/missions/);
  });

  it("keeps every phase playbook present and actionable", () => {
    const requiredDocs = [
      "docs/growth/LAUNCH_FOUNDATION.md",
      "docs/growth/PRELAUNCH_AUDIENCE_PLAYBOOK.md",
      "docs/growth/SOFT_LAUNCH_PLAYBOOK.md",
      "docs/growth/REVENUE_SPRINT_PLAYBOOK.md",
      "docs/growth/PARTNERSHIP_ENGINE.md",
      "docs/growth/GLOBAL_SCALE_PLAYBOOK.md",
      "docs/growth/WEEKLY_REVIEW_TEMPLATE.md",
      "docs/growth/REVENUE_SOURCE_EXPERIMENTS.md",
    ];

    for (const doc of requiredDocs) {
      expect(existsSync(doc), `${doc} should exist`).toBe(true);
      expect(read(doc).length, `${doc} should not be empty`).toBeGreaterThan(500);
    }
  });

  it("keeps the first campaign seed pack approval-gated and dry-run by default", () => {
    const seed = readJson<{
      defaultMode: string;
      approvalRequired: boolean;
      suppressionRequired: boolean;
      campaigns: Array<{ key: string; approvalNotes: string }>;
    }>("automation/growth-campaigns/seed-campaigns.json");

    expect(seed.defaultMode).toBe("dry_run");
    expect(seed.approvalRequired).toBe(true);
    expect(seed.suppressionRequired).toBe(true);
    expect(seed.campaigns).toHaveLength(10);
    expect(seed.campaigns.map((campaign) => campaign.key)).toEqual(
      expect.arrayContaining([
        "parent_waitlist_starter_pack",
        "founder_annual",
        "creator_affiliate",
        "school_pilot",
        "clinic_snapshot",
        "employer_benefit",
        "weekly_growth_review",
      ]),
    );
    expect(seed.campaigns.every((campaign) => campaign.approvalNotes.length > 10)).toBe(true);
  });

  it("keeps all growth n8n workflows inactive and dry-run oriented", () => {
    const workflows = [
      "automation/n8n/workflows/growth_market_intelligence_dry_run.json",
      "automation/n8n/workflows/growth_opportunity_discovery_dry_run.json",
      "automation/n8n/workflows/growth_campaign_planning_dry_run.json",
      "automation/n8n/workflows/growth_mautic_sync_dry_run.json",
      "automation/n8n/workflows/growth_postiz_scheduling_dry_run.json",
      "automation/n8n/workflows/growth_partner_followup_dry_run.json",
      "automation/n8n/workflows/growth_weekly_review_dry_run.json",
      "automation/n8n/workflows/lib/growth_approval_gate.json",
    ];

    for (const workflow of workflows) {
      const raw = read(workflow);
      const parsed = readJson<{ active: boolean; name: string }>(workflow);
      expect(parsed.active, `${workflow} must not be active by default`).toBe(false);
      expect(parsed.name, `${workflow} should be a growth workflow`).toContain("growth");
      expect(raw, `${workflow} should preserve dry-run guardrails`).toContain("dryRun");
    }
  });

  it("keeps Mautic and Hermes configured for safe draft-only operations", () => {
    const mautic = readJson<{
      safeDefaults: { emailSendEnabled: boolean; requireGrowthApproval: boolean; requireSuppressionCheck: boolean };
      segments: unknown[];
      campaignTemplates: unknown[];
    }>("automation/mautic/segments-and-campaigns.json");
    const hermes = readJson<{
      dryRun: boolean;
      jobs: Array<{ key: string; approvalRequired: boolean }>;
    }>("automation/hermes/schedules.json");

    expect(mautic.safeDefaults.emailSendEnabled).toBe(false);
    expect(mautic.safeDefaults.requireGrowthApproval).toBe(true);
    expect(mautic.safeDefaults.requireSuppressionCheck).toBe(true);
    expect(mautic.segments.length).toBeGreaterThanOrEqual(5);
    expect(mautic.campaignTemplates.length).toBeGreaterThanOrEqual(5);

    expect(hermes.dryRun).toBe(true);
    expect(hermes.jobs.map((job) => job.key)).toEqual(
      expect.arrayContaining(["daily_market_intelligence", "daily_opportunity_radar", "weekly_growth_review"]),
    );
    expect(hermes.jobs.some((job) => job.approvalRequired)).toBe(true);
  });

  it("keeps Growth Command Center schema seeded for ICPs, revenue sources, and milestones", () => {
    const migration = read("supabase/migrations/00016_growth_command_center.sql");

    expect(migration).toContain("growth_icp_definitions");
    expect(migration).toContain("growth_revenue_sources");
    expect(migration).toContain("parents_enrichment_3_8");
    expect(migration).toContain("employer_family_benefit");
    expect(migration).toContain("Milestone: first $1k revenue");
    expect(migration).toContain("Milestone: $10M signed or collected revenue");
  });

  it("keeps admin Mission HQ catalog in sync between app and Edge", () => {
    const root = read("src/lib/growth/adminMissionCatalog.ts");
    const edge = read("supabase/functions/server/admin_mission_catalog.ts");
    const rootCount = (root.match(/mission\(/g) ?? []).length;
    const edgeCount = (edge.match(/mission\(/g) ?? []).length;
    expect(rootCount).toBe(edgeCount);
    expect(rootCount).toBeGreaterThanOrEqual(48);
  });
});

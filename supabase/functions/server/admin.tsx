// @ts-nocheck
import { type Context, type Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import {
  buildAdminAuditRow,
  canAccessAdminRole,
  normaliseAdminRole,
  parseBearerToken,
  type AdminRole,
} from "./admin_access.ts";

function admin(): ReturnType<typeof createClient> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("supabase env not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getRole(userId: string): Promise<{ role: AdminRole; email: string } | null> {
  const { data, error } = await admin()
    .from("admin_users")
    .select("role, email, disabled_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data || data.disabled_at) return null;
  const role = normaliseAdminRole(data.role);
  if (!role) return null;
  return { role, email: data.email as string };
}

export function requireAdmin(min: AdminRole) {
  return async (c: Context, next: () => Promise<void>) => {
    const token = parseBearerToken(c.req.header("authorization"));
    if (!token) return c.json({ error: "unauthorized" }, 401);
    try {
      const sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data, error } = await sb.auth.getUser(token);
      if (error || !data.user?.id) return c.json({ error: "unauthorized" }, 401);
      const role = await getRole(data.user.id);
      if (!role) return c.json({ error: "forbidden" }, 403);
      if (!canAccessAdminRole(role.role, min)) return c.json({ error: "forbidden" }, 403);
      c.set("admin", { userId: data.user.id, email: role.email, role: role.role });
      await next();
    } catch (err) {
      console.error("requireAdmin failed", err);
      return c.json({ error: "unauthorized" }, 401);
    }
  };
}

async function audit(
  c: Context,
  action: string,
  payload?: Record<string, unknown>,
  target?: { type: string; id: string },
) {
  try {
    const a = c.get("admin") as { userId: string; email: string };
    await admin().from("admin_audit_log").insert(buildAdminAuditRow(a, action, payload, target, {
      forwardedFor: c.req.header("x-forwarded-for"),
      userAgent: c.req.header("user-agent"),
    }));
  } catch (err) {
    console.error("audit failed", err);
  }
}

function cleanString(value: unknown, max = 500): string {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max) : cleaned;
}

function optionalString(value: unknown, max = 500): string | null {
  const cleaned = cleanString(value, max);
  return cleaned ? cleaned : null;
}

function numberInRange(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function boolValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isoDate(value: unknown): string {
  const raw = cleanString(value, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 10);
}

function jsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value.slice(0, 50) : [];
}

function jsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function registerAdminRoutes(app: Hono): void {
  // ── Identity ────────────────────────────────────────────────────────────
  app.get("/admin/me", requireAdmin("readonly"), (c) => {
    return c.json(c.get("admin"));
  });

  // ── Users / children / families ─────────────────────────────────────────
  app.get("/admin/families", requireAdmin("analyst"), async (c) => {
    const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
    const search = c.req.query("q");
    let q = admin().from("profiles").select("*", { count: "exact" }).limit(limit);
    if (search) q = q.ilike("email", `%${search}%`);
    const { data, count, error } = await q;
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data, count });
  });

  app.get("/admin/families/:userId", requireAdmin("analyst"), async (c) => {
    const userId = c.req.param("userId");
    const sb = admin();
    const [profile, children, sessions, sub] = await Promise.all([
      sb.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      sb.from("children").select("*").eq("user_id", userId),
      sb.from("sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      sb.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
    ]);
    return c.json({
      profile: profile.data,
      children: children.data,
      sessions: sessions.data,
      subscription: sub.data,
    });
  });

  app.post("/admin/families/:userId/comp-premium", requireAdmin("support"), async (c) => {
    const userId = c.req.param("userId");
    const { months = 1, reason } = (await c.req.json().catch(() => ({}))) as {
      months?: number;
      reason?: string;
    };
    const expiresAt = new Date(Date.now() + months * 30 * 86_400 * 1000).toISOString();
    await admin().from("subscriptions").upsert(
      {
        user_id: userId,
        plan: "premium",
        status: "active",
        source: "comp",
        expires_at: expiresAt,
      },
      { onConflict: "user_id" },
    );
    await audit(c, "comp_premium", { months, reason }, { type: "user", id: userId });
    return c.json({ ok: true, expiresAt });
  });

  // ── Activities ──────────────────────────────────────────────────────────
  app.get("/admin/activities", requireAdmin("readonly"), async (c) => {
    const { data, error } = await admin()
      .from("activity_attempts")
      .select("activity_id, count:user_id, avg_rating:avg_rating", { count: "exact" })
      .limit(500);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  });

  // ── Subscriptions / billing ─────────────────────────────────────────────
  app.get("/admin/subscriptions", requireAdmin("analyst"), async (c) => {
    const status = c.req.query("status");
    let q = admin().from("subscriptions").select("*", { count: "exact" }).limit(200);
    if (status) q = q.eq("status", status);
    const { data, count, error } = await q;
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data, count });
  });

  // ── Caregivers / portfolio / narrative ─────────────────────────────────
  app.get("/admin/caregivers", requireAdmin("analyst"), async (c) => {
    const { data } = await admin().from("caregivers").select("*").limit(500);
    return c.json({ data });
  });
  app.get("/admin/portfolio", requireAdmin("analyst"), async (c) => {
    const { data } = await admin().from("portfolio_entries").select("*").limit(500);
    return c.json({ data });
  });

  // ── Feedback / reviews ─────────────────────────────────────────────────
  app.get("/admin/feedback", requireAdmin("support"), async (c) => {
    const { data } = await admin()
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return c.json({ data });
  });

  // ── Cohorts / retention (computed from events_sink) ────────────────────
  app.get("/admin/metrics/dau", requireAdmin("analyst"), async (c) => {
    const { data, error } = await admin().rpc("admin_dau_30d");
    if (error) return c.json({ error: error.message, hint: "create rpc admin_dau_30d" }, 500);
    return c.json({ data });
  });
  app.get("/admin/metrics/funnel", requireAdmin("analyst"), async (c) => {
    const { data, error } = await admin().rpc("admin_onboarding_funnel");
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  });

  // ── Cost ledger (studio + automation) ──────────────────────────────────
  app.get("/admin/costs", requireAdmin("analyst"), async (c) => {
    const { data } = await admin()
      .from("studio_cost_ledger")
      .select("service, provider, sum:cost_usd")
      .gte("created_at", new Date(Date.now() - 30 * 86_400 * 1000).toISOString())
      .limit(500);
    return c.json({ data });
  });

  // ── Growth Command Center ───────────────────────────────────────────────
  app.get("/admin/growth/overview", requireAdmin("marketing"), async (c) => {
    const sb = admin();
    const since = c.req.query("since") ?? new Date(Date.now() - 30 * 86_400 * 1000).toISOString().slice(0, 10);
    const [okrs, checkpoints, leads, icps, opportunities, campaigns, approvals, readiness, switches, briefs, experiments, sources, runs] = await Promise.all([
      sb.from("growth_daily_okrs").select("*").order("okr_date", { ascending: false }).limit(14),
      sb.from("growth_revenue_checkpoints").select("*").gte("checkpoint_date", since).order("checkpoint_date", { ascending: false }).limit(200),
      sb.from("growth_leads").select("id, email, segment, lead_magnet, status, source, created_at").gte("created_at", `${since}T00:00:00Z`).order("created_at", { ascending: false }).limit(100),
      sb.from("growth_icp_definitions").select("*").order("priority").limit(50),
      sb.from("growth_opportunities").select("*").order("updated_at", { ascending: false }).limit(50),
      sb.from("growth_campaigns").select("*").order("created_at", { ascending: false }).limit(50),
      sb.from("growth_approval_queue").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(50),
      sb.from("growth_readiness_scores").select("*").order("subsystem"),
      sb.from("growth_kill_switches").select("*").order("key"),
      sb.from("growth_agent_briefs").select("*").order("brief_date", { ascending: false }).limit(10),
      sb.from("growth_experiments").select("*").order("created_at", { ascending: false }).limit(30),
      sb.from("growth_revenue_sources").select("*").order("created_at", { ascending: false }).limit(50),
      sb.from("growth_automation_runs").select("*").order("created_at", { ascending: false }).limit(30),
    ]);
    const currentOkr = okrs.data?.[0] ?? null;
    const keyResults = currentOkr
      ? await sb.from("growth_key_results").select("*").eq("okr_id", currentOkr.id).order("created_at")
      : { data: [], error: null };
    const checkpointRows = checkpoints.data ?? [];
    const cashRevenue = checkpointRows
      .filter((r) => r.revenue_type === "cash" || r.revenue_type === "signed_contract")
      .reduce((sum, r) => sum + Number(r.amount_usd ?? 0), 0);
    const weightedPipeline = checkpointRows
      .filter((r) => r.revenue_type === "pipeline")
      .reduce((sum, r) => sum + Number(r.amount_usd ?? 0) * Number(r.probability ?? 0), 0);
    const readinessRows = readiness.data ?? [];
    const readinessAverage = readinessRows.length
      ? Math.round(readinessRows.reduce((sum, r) => sum + Number(r.score ?? 0), 0) / readinessRows.length)
      : 0;
    const blockingSwitches = (switches.data ?? []).filter((s) => s.enabled);
    return c.json({
      okrs: okrs.data ?? [],
      currentOkr,
      keyResults: keyResults.data ?? [],
      checkpoints: checkpointRows,
      leads: leads.data ?? [],
      icps: icps.data ?? [],
      opportunities: opportunities.data ?? [],
      campaigns: campaigns.data ?? [],
      approvals: approvals.data ?? [],
      readiness: readinessRows,
      killSwitches: switches.data ?? [],
      briefs: briefs.data ?? [],
      experiments: experiments.data ?? [],
      revenueSources: sources.data ?? [],
      automationRuns: runs.data ?? [],
      summary: {
        since,
        cashRevenue,
        weightedPipeline,
        pendingApprovals: approvals.data?.length ?? 0,
        leadCount: leads.data?.length ?? 0,
        opportunityCount: opportunities.data?.length ?? 0,
        campaignCount: campaigns.data?.length ?? 0,
        revenueSourceCount: sources.data?.length ?? 0,
        readinessAverage,
        blockingSwitches: blockingSwitches.length,
        liveAutomationAllowed:
          readinessAverage >= 90 &&
          blockingSwitches.length === 0 &&
          readinessRows.every((r) => Number(r.score ?? 0) >= 85 && Number(r.p0_open ?? 0) === 0 && Number(r.p1_open ?? 0) === 0),
      },
    });
  });

  app.post("/admin/growth/daily-okrs", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const actor = c.get("admin") as { userId: string; email: string };
    const okrDate = isoDate(body.okrDate);
    const objective = cleanString(body.objective, 800);
    if (!objective) return c.json({ error: "objective required" }, 400);
    const payload = {
      okr_date: okrDate,
      objective,
      objective_type: cleanString(body.objectiveType, 30) || "revenue",
      owner_email: optionalString(body.ownerEmail, 200) ?? actor.email,
      confidence: numberInRange(body.confidence, 0, 1, 0.7),
      status: cleanString(body.status, 30) || "planned",
      base_revenue_usd: numberInRange(body.baseRevenueUsd, 0, 100_000_000, 0),
      stretch_revenue_usd: numberInRange(body.stretchRevenueUsd, 0, 100_000_000, 0),
      over_revenue_usd: numberInRange(body.overRevenueUsd, 0, 100_000_000, 0),
      actual_revenue_usd: numberInRange(body.actualRevenueUsd, 0, 100_000_000, 0),
      base_pipeline_usd: numberInRange(body.basePipelineUsd, 0, 100_000_000, 0),
      actual_pipeline_usd: numberInRange(body.actualPipelineUsd, 0, 100_000_000, 0),
      recovery_required: boolValue(body.recoveryRequired),
      created_by: actor.userId,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await admin()
      .from("growth_daily_okrs")
      .upsert(payload, { onConflict: "okr_date" })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    const keyResults = jsonArray(body.keyResults);
    if (data?.id && keyResults.length) {
      await admin().from("growth_key_results").delete().eq("okr_id", data.id);
      const rows = keyResults
        .map((item) => jsonObject(item))
        .map((kr) => ({
          okr_id: data.id,
          label: cleanString(kr.label, 300),
          metric_key: cleanString(kr.metricKey, 80) || "manual",
          unit: cleanString(kr.unit, 40) || "count",
          base_target: numberInRange(kr.baseTarget, 0, 100_000_000, 0),
          stretch_target: numberInRange(kr.stretchTarget, 0, 100_000_000, 0),
          over_target: numberInRange(kr.overTarget, 0, 100_000_000, 0),
          actual_value: numberInRange(kr.actualValue, 0, 100_000_000, 0),
          status: cleanString(kr.status, 30) || "planned",
          evidence: jsonArray(kr.evidence),
        }))
        .filter((kr) => kr.label);
      if (rows.length) await admin().from("growth_key_results").insert(rows);
    }
    await audit(c, "growth_daily_okr_upsert", { okrDate, objective }, { type: "growth_daily_okr", id: String(data?.id ?? okrDate) });
    return c.json({ data });
  });

  app.post("/admin/growth/daily-okrs/:id/score", requireAdmin("marketing"), async (c) => {
    const id = c.req.param("id");
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const score = numberInRange(body.okrScore, 0, 2, 0);
    const status = score >= 2 ? "overachieved" : score >= 1.5 ? "stretch_hit" : score >= 1 ? "base_hit" : score >= 0.4 ? "missed" : "missed";
    const { data, error } = await admin()
      .from("growth_daily_okrs")
      .update({
        okr_score: score,
        status: cleanString(body.status, 30) || status,
        actual_revenue_usd: numberInRange(body.actualRevenueUsd, 0, 100_000_000, 0),
        actual_pipeline_usd: numberInRange(body.actualPipelineUsd, 0, 100_000_000, 0),
        evidence: jsonArray(body.evidence),
        lessons_learned: optionalString(body.lessonsLearned, 2000),
        next_day_adjustment: optionalString(body.nextDayAdjustment, 2000),
        recovery_required: boolValue(body.recoveryRequired, score < 1),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_daily_okr_score", { score }, { type: "growth_daily_okr", id });
    return c.json({ data });
  });

  app.post("/admin/growth/revenue-checkpoints", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const actor = c.get("admin") as { userId: string; email: string };
    const amount = numberInRange(body.amountUsd, -100_000_000, 100_000_000, 0);
    const description = cleanString(body.description, 1000);
    if (!description || amount === 0) return c.json({ error: "amountUsd and description required" }, 400);
    const { data, error } = await admin()
      .from("growth_revenue_checkpoints")
      .insert({
        checkpoint_date: isoDate(body.checkpointDate),
        source: cleanString(body.source, 80) || "manual",
        revenue_type: cleanString(body.revenueType, 40) || "cash",
        segment: cleanString(body.segment, 40) || "consumer",
        amount_usd: amount,
        probability: numberInRange(body.probability, 0, 1, 1),
        description,
        evidence_url: optionalString(body.evidenceUrl, 1000),
        owner_email: optionalString(body.ownerEmail, 200) ?? actor.email,
        created_by: actor.userId,
      })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_revenue_checkpoint_create", { amount }, { type: "growth_revenue_checkpoint", id: String(data?.id ?? "") });
    return c.json({ data });
  });

  app.post("/admin/growth/approvals", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const title = cleanString(body.title, 500);
    if (!title) return c.json({ error: "title required" }, 400);
    const { data, error } = await admin()
      .from("growth_approval_queue")
      .insert({
        item_type: cleanString(body.itemType, 40) || "agent_action",
        title,
        risk_level: cleanString(body.riskLevel, 20) || "medium",
        channel: optionalString(body.channel, 80),
        audience: optionalString(body.audience, 500),
        draft_payload: jsonObject(body.draftPayload),
        compliance_notes: optionalString(body.complianceNotes, 2000),
        requested_by: cleanString(body.requestedBy, 120) || "admin",
      })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_approval_create", { title }, { type: "growth_approval", id: String(data?.id ?? "") });
    return c.json({ data });
  });

  app.post("/admin/growth/approvals/:id/:decision", requireAdmin("marketing"), async (c) => {
    const id = c.req.param("id");
    const decision = c.req.param("decision");
    if (!["approve", "reject", "changes"].includes(decision)) return c.json({ error: "invalid decision" }, 400);
    const actor = c.get("admin") as { userId: string };
    const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "changes_requested";
    const { data, error } = await admin()
      .from("growth_approval_queue")
      .update({ status, approved_by: actor.userId, decided_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, `growth_approval_${status}`, {}, { type: "growth_approval", id });
    return c.json({ data });
  });

  app.post("/admin/growth/kill-switches/:key", requireAdmin("marketing"), async (c) => {
    const key = c.req.param("key");
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const actor = c.get("admin") as { userId: string };
    const { data, error } = await admin()
      .from("growth_kill_switches")
      .update({
        enabled: boolValue(body.enabled),
        reason: optionalString(body.reason, 1000),
        updated_by: actor.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key)
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_kill_switch_update", { key, enabled: body.enabled }, { type: "growth_kill_switch", id: key });
    return c.json({ data });
  });

  app.post("/admin/growth/readiness", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const actor = c.get("admin") as { userId: string };
    const subsystem = cleanString(body.subsystem, 120);
    if (!subsystem) return c.json({ error: "subsystem required" }, 400);
    const score = Math.round(numberInRange(body.score, 0, 100, 0));
    const status = score >= 95 ? "excellent" : score >= 85 ? "ready" : score >= 50 ? "needs_work" : "blocked";
    const { data, error } = await admin()
      .from("growth_readiness_scores")
      .upsert({
        subsystem,
        score,
        status: cleanString(body.status, 30) || status,
        p0_open: Math.round(numberInRange(body.p0Open, 0, 1000, 0)),
        p1_open: Math.round(numberInRange(body.p1Open, 0, 1000, 0)),
        last_verified_at: new Date().toISOString(),
        checklist: jsonObject(body.checklist),
        notes: optionalString(body.notes, 2000),
        updated_by: actor.userId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "subsystem" })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_readiness_upsert", { subsystem, score }, { type: "growth_readiness", id: subsystem });
    return c.json({ data });
  });

  app.post("/admin/growth/suppression", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const channel = cleanString(body.channel, 80) || "email";
    const value = cleanString(body.value, 500);
    const reason = cleanString(body.reason, 1000);
    if (!value || !reason) return c.json({ error: "value and reason required" }, 400);
    const actor = c.get("admin") as { userId: string };
    const valueHash = await sha256Hex(value);
    const { data, error } = await admin()
      .from("growth_compliance_suppression")
      .upsert({
        channel,
        value_hash: valueHash,
        value_label: optionalString(body.valueLabel, 200) ?? value.slice(0, 3).padEnd(value.length, "*"),
        reason,
        source: cleanString(body.source, 80) || "manual",
        created_by: actor.userId,
      }, { onConflict: "channel,value_hash" })
      .select("id, channel, value_label, reason, source, created_at")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_suppression_upsert", { channel, reason }, { type: "growth_suppression", id: String(data?.id ?? "") });
    return c.json({ data });
  });

  app.post("/admin/growth/agent-briefs", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const { data, error } = await admin()
      .from("growth_agent_briefs")
      .insert({
        brief_date: isoDate(body.briefDate),
        agent: cleanString(body.agent, 80) || "hermes",
        brief_type: cleanString(body.briefType, 40) || "daily",
        okr_score: numberInRange(body.okrScore, 0, 2, 0),
        revenue_target_usd: numberInRange(body.revenueTargetUsd, 0, 100_000_000, 0),
        revenue_actual_usd: numberInRange(body.revenueActualUsd, 0, 100_000_000, 0),
        biggest_win: optionalString(body.biggestWin, 2000),
        biggest_miss: optionalString(body.biggestMiss, 2000),
        top_objection: optionalString(body.topObjection, 2000),
        conversion_bottleneck: optionalString(body.conversionBottleneck, 2000),
        product_risk: optionalString(body.productRisk, 2000),
        recommended_objective: optionalString(body.recommendedObjective, 2000),
        experiments: jsonArray(body.experiments),
        stop_doing: jsonArray(body.stopDoing),
        recovery_action: optionalString(body.recoveryAction, 2000),
      })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_agent_brief_create", { briefType: body.briefType }, { type: "growth_agent_brief", id: String(data?.id ?? "") });
    return c.json({ data });
  });

  app.get("/admin/growth/opportunities", requireAdmin("marketing"), async (c) => {
    const stage = c.req.query("stage");
    let q = admin().from("growth_opportunities").select("*").order("priority").order("updated_at", { ascending: false }).limit(200);
    if (stage) q = q.eq("stage", stage);
    const { data, error } = await q;
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  });

  app.post("/admin/growth/opportunities", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = cleanString(body.name, 300);
    if (!name) return c.json({ error: "name required" }, 400);
    const actor = c.get("admin") as { userId: string; email: string };
    const { data, error } = await admin()
      .from("growth_opportunities")
      .insert({
        name,
        organization: optionalString(body.organization, 300),
        segment: cleanString(body.segment, 80) || "partner",
        country: optionalString(body.country, 80),
        source_url: optionalString(body.sourceUrl, 1000),
        contact_email: optionalString(body.contactEmail, 300),
        estimated_value_usd: numberInRange(body.estimatedValueUsd, 0, 100_000_000, 0),
        stage: cleanString(body.stage, 40) || "research",
        priority: Math.round(numberInRange(body.priority, 1, 5, 3)),
        compliance_state: cleanString(body.complianceState, 40) || "needs_review",
        next_action: optionalString(body.nextAction, 1000),
        owner_email: optionalString(body.ownerEmail, 200) ?? actor.email,
        agent_rationale: optionalString(body.agentRationale, 2000),
        created_by: actor.userId,
      })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_opportunity_create", { name }, { type: "growth_opportunity", id: String(data?.id ?? "") });
    return c.json({ data });
  });

  app.post("/admin/growth/opportunities/:id/stage", requireAdmin("marketing"), async (c) => {
    const id = c.req.param("id");
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const stage = cleanString(body.stage, 40);
    if (!stage) return c.json({ error: "stage required" }, 400);
    const { data, error } = await admin()
      .from("growth_opportunities")
      .update({
        stage,
        next_action: optionalString(body.nextAction, 1000),
        next_action_at: optionalString(body.nextActionAt, 80),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_opportunity_stage_update", { stage }, { type: "growth_opportunity", id });
    return c.json({ data });
  });

  app.get("/admin/growth/campaigns", requireAdmin("marketing"), async (c) => {
    const { data, error } = await admin()
      .from("growth_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  });

  app.post("/admin/growth/campaigns", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = cleanString(body.name, 300);
    const audience = cleanString(body.audience, 800);
    const offer = cleanString(body.offer, 800);
    if (!name || !audience || !offer) return c.json({ error: "name, audience, and offer required" }, 400);
    const actor = c.get("admin") as { userId: string; email: string };
    const approvalRequired = boolValue(body.approvalRequired, true);
    const { data, error } = await admin()
      .from("growth_campaigns")
      .insert({
        name,
        channel: cleanString(body.channel, 40) || "email",
        status: approvalRequired ? "approval_required" : "draft",
        audience,
        offer,
        hypothesis: optionalString(body.hypothesis, 2000),
        success_metric: optionalString(body.successMetric, 500),
        fail_metric: optionalString(body.failMetric, 500),
        owner_email: optionalString(body.ownerEmail, 200) ?? actor.email,
        dry_run_required: boolValue(body.dryRunRequired, true),
        approval_required: approvalRequired,
        created_by: actor.userId,
      })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    if (data?.id && approvalRequired) {
      await admin().from("growth_approval_queue").insert({
        item_type: "campaign",
        item_id: data.id,
        title: `Approve campaign: ${name}`,
        risk_level: "medium",
        channel: data.channel,
        audience,
        draft_payload: { campaignId: data.id, name, offer },
        compliance_notes: "Review claims, audience, opt-out, rate limits, and suppression checks before approving.",
        requested_by: actor.email,
      });
    }
    await audit(c, "growth_campaign_create", { name }, { type: "growth_campaign", id: String(data?.id ?? "") });
    return c.json({ data });
  });

  app.post("/admin/growth/experiments", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = cleanString(body.name, 300);
    const hypothesis = cleanString(body.hypothesis, 2000);
    if (!name || !hypothesis) return c.json({ error: "name and hypothesis required" }, 400);
    const actor = c.get("admin") as { userId: string };
    const { data, error } = await admin()
      .from("growth_experiments")
      .insert({
        name,
        category: cleanString(body.category, 40) || "other",
        hypothesis,
        audience: cleanString(body.audience, 800) || "parents",
        offer: cleanString(body.offer, 800) || "NeuroSpark",
        channel: cleanString(body.channel, 80) || "manual",
        success_metric: cleanString(body.successMetric, 500) || "revenue or qualified pipeline",
        fail_metric: cleanString(body.failMetric, 500) || "no qualified signal",
        status: cleanString(body.status, 40) || "planned",
        started_at: optionalString(body.startedAt, 80),
        decision_due_at: optionalString(body.decisionDueAt, 80),
        created_by: actor.userId,
      })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_experiment_create", { name }, { type: "growth_experiment", id: String(data?.id ?? "") });
    return c.json({ data });
  });

  app.get("/admin/growth/icps", requireAdmin("marketing"), async (c) => {
    const { data, error } = await admin()
      .from("growth_icp_definitions")
      .select("*")
      .order("priority")
      .limit(100);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  });

  app.get("/admin/growth/revenue-sources", requireAdmin("marketing"), async (c) => {
    const { data, error } = await admin()
      .from("growth_revenue_sources")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  });

  app.post("/admin/growth/revenue-sources/:key/status", requireAdmin("marketing"), async (c) => {
    const key = c.req.param("key");
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const status = cleanString(body.status, 40);
    if (!status) return c.json({ error: "status required" }, 400);
    const { data, error } = await admin()
      .from("growth_revenue_sources")
      .update({
        status,
        evidence: jsonArray(body.evidence),
        updated_at: new Date().toISOString(),
      })
      .eq("key", key)
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_revenue_source_status", { key, status }, { type: "growth_revenue_source", id: key });
    return c.json({ data });
  });

  app.post("/admin/growth/automation-runs", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const workflowKey = cleanString(body.workflowKey, 200);
    if (!workflowKey) return c.json({ error: "workflowKey required" }, 400);
    const { data, error } = await admin()
      .from("growth_automation_runs")
      .insert({
        system: cleanString(body.system, 40) || "other",
        workflow_key: workflowKey,
        status: cleanString(body.status, 40) || "dry_run",
        dry_run: boolValue(body.dryRun, true),
        cost_usd: numberInRange(body.costUsd, 0, 1_000_000, 0),
        started_at: optionalString(body.startedAt, 80),
        finished_at: optionalString(body.finishedAt, 80),
        error: optionalString(body.error, 2000),
        metadata: jsonObject(body.metadata),
      })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_automation_run_create", { workflowKey }, { type: "growth_automation_run", id: String(data?.id ?? "") });
    return c.json({ data });
  });

  app.get("/admin/growth/mautic/status", requireAdmin("marketing"), async (c) => {
    const base = Deno.env.get("MAUTIC_BASE_URL");
    const user = Deno.env.get("MAUTIC_API_USER");
    const pass = Deno.env.get("MAUTIC_API_PASSWORD");
    const emailEnabled = Deno.env.get("MAUTIC_EMAIL_SEND_ENABLED") === "true";
    if (!base || !user || !pass) {
      return c.json({
        configured: false,
        ok: false,
        emailEnabled,
        safeToSend: false,
        reason: "mautic env not configured",
      });
    }
    try {
      const r = await fetch(`${base.replace(/\/$/, "")}/api/users/self`, {
        headers: { Authorization: `Basic ${btoa(`${user}:${pass}`)}` },
      });
      return c.json({
        configured: true,
        ok: r.ok,
        status: r.status,
        emailEnabled,
        safeToSend: false,
        reason: emailEnabled ? "email enabled; still requires approval/suppression gates" : "email sending disabled by default",
      });
    } catch (err) {
      return c.json({ configured: true, ok: false, emailEnabled, safeToSend: false, error: String(err) });
    }
  });

  app.get("/admin/growth/mautic/summary", requireAdmin("marketing"), async (c) => {
    const sb = admin();
    const [leadCount, campaigns, runs] = await Promise.all([
      sb.from("growth_leads").select("id", { count: "exact", head: true }),
      sb.from("growth_campaigns").select("id, name, channel, status").order("created_at", { ascending: false }).limit(20),
      sb.from("growth_automation_runs").select("*").eq("system", "mautic").order("created_at", { ascending: false }).limit(20),
    ]);
    return c.json({
      leadCount: leadCount.count ?? 0,
      approvalGatedCampaigns: campaigns.data ?? [],
      recentRuns: runs.data ?? [],
      emailSendEnabled: Deno.env.get("MAUTIC_EMAIL_SEND_ENABLED") === "true",
      productionGate: "blocked_until_manual_approval_suppression_and_domain_auth",
    });
  });

  app.post("/admin/growth/webhooks/n8n", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const workflowKey = cleanString(body.workflowKey, 200) || "n8n-webhook";
    const dryRun = boolValue(body.dryRun, true);
    const forceManual = await admin().from("growth_kill_switches").select("enabled").eq("key", "force_manual_approval").maybeSingle();
    const globalPause = await admin().from("growth_kill_switches").select("enabled").eq("key", "global_marketing_pause").maybeSingle();
    const blocked = Boolean(forceManual.data?.enabled || globalPause.data?.enabled || !dryRun);
    const { data, error } = await admin()
      .from("growth_automation_runs")
      .insert({
        system: "n8n",
        workflow_key: workflowKey,
        status: blocked ? "blocked" : "dry_run",
        dry_run: dryRun,
        error: blocked ? "Blocked by Growth Command Center approval/kill-switch policy." : null,
        metadata: jsonObject(body),
      })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_n8n_webhook", { workflowKey, blocked }, { type: "growth_automation_run", id: String(data?.id ?? "") });
    return c.json({ ok: !blocked, blocked, data });
  });

  app.post("/admin/growth/webhooks/mautic", requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const { data, error } = await admin()
      .from("growth_automation_runs")
      .insert({
        system: "mautic",
        workflow_key: cleanString(body.event, 200) || "mautic-event",
        status: "dry_run",
        dry_run: true,
        metadata: jsonObject(body),
      })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "growth_mautic_webhook", { event: body.event }, { type: "growth_automation_run", id: String(data?.id ?? "") });
    return c.json({ ok: true, data });
  });

  // ── Studio job control plane proxy ─────────────────────────────────────
  app.all("/admin/studio/*", requireAdmin("marketing"), async (c) => {
    const base = Deno.env.get("STUDIO_BASE_URL");
    const tok = Deno.env.get("STUDIO_BEARER_TOKEN");
    if (!base || !tok) return c.json({ error: "studio not configured" }, 503);
    const path = c.req.path.replace("/admin/studio", "/studio");
    const url = new URL(c.req.url);
    const target = `${base}${path}${url.search}`;
    const init: RequestInit = {
      method: c.req.method,
      headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
      body: c.req.method === "GET" || c.req.method === "HEAD" ? undefined : await c.req.text(),
    };
    const r = await fetch(target, init);
    const body = await r.text();
    if (c.req.method !== "GET") {
      await audit(c, "studio_proxy", { method: c.req.method, path }, { type: "studio", id: path });
    }
    return new Response(body, {
      status: r.status,
      headers: { "Content-Type": r.headers.get("content-type") ?? "application/json" },
    });
  });

  // ── Admin-user management (superadmin only) ────────────────────────────
  app.get("/admin/users", requireAdmin("superadmin"), async (c) => {
    const { data, error } = await admin().from("admin_users").select("*").order("created_at");
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  });
  app.post("/admin/users", requireAdmin("superadmin"), async (c) => {
    const body = (await c.req.json()) as { user_id: string; email: string; role: AdminRole };
    const a = c.get("admin") as { userId: string };
    const { error } = await admin().from("admin_users").upsert(
      { ...body, created_by: a.userId, disabled_at: null },
      { onConflict: "user_id" },
    );
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "admin_user_upsert", body, { type: "admin_user", id: body.user_id });
    return c.json({ ok: true });
  });
  app.delete("/admin/users/:id", requireAdmin("superadmin"), async (c) => {
    const id = c.req.param("id");
    await admin().from("admin_users").update({ disabled_at: new Date().toISOString() }).eq("user_id", id);
    await audit(c, "admin_user_disable", { id }, { type: "admin_user", id });
    return c.json({ ok: true });
  });

  // ── Postiz (social distribution) proxy ─────────────────────────────────
  // Keeps the API key server-side. Frontend embeds the Postiz UI in an
  // iframe (separate auth) AND uses these endpoints for status / quick
  // actions / "publish from Studio job" flows that don't need the full UI.
  app.get("/admin/postiz/status", requireAdmin("readonly"), async (c) => {
    const base = Deno.env.get("POSTIZ_BASE_URL");
    const key = Deno.env.get("POSTIZ_API_KEY");
    const ui = Deno.env.get("POSTIZ_FRONTEND_URL") ?? base;
    if (!base || !key) {
      return c.json({ configured: false, ok: false, ui: ui ?? null });
    }
    try {
      const r = await fetch(`${base}/public/v1/integrations/check-connection`, {
        headers: { Authorization: key },
      });
      return c.json({
        configured: true,
        ok: r.ok,
        status: r.status,
        ui,
      });
    } catch (err) {
      return c.json({ configured: true, ok: false, error: String(err), ui });
    }
  });

  app.get("/admin/postiz/summary", requireAdmin("marketing"), async (c) => {
    const base = Deno.env.get("POSTIZ_BASE_URL");
    const key = Deno.env.get("POSTIZ_API_KEY");
    if (!base || !key) return c.json({ error: "postiz not configured" }, 503);
    const since = new Date().toISOString();
    const until = new Date(Date.now() + 7 * 86_400 * 1000).toISOString();
    const [integrations, posts] = await Promise.all([
      fetch(`${base}/public/v1/integrations`, { headers: { Authorization: key } })
        .then((r) => r.json())
        .catch(() => []),
      fetch(`${base}/public/v1/posts?from=${since}&to=${until}`, {
        headers: { Authorization: key },
      })
        .then((r) => r.json())
        .catch(() => []),
    ]);
    return c.json({
      channelCount: Array.isArray(integrations) ? integrations.length : 0,
      channels: Array.isArray(integrations) ? integrations : [],
      upcomingCount: Array.isArray(posts) ? posts.length : 0,
      upcoming: Array.isArray(posts) ? posts.slice(0, 25) : [],
    });
  });

  // Generic pass-through (POST/PATCH/DELETE) — useful for "publish from
  // Studio job" buttons without exposing the API key client-side.
  app.all("/admin/postiz/proxy/*", requireAdmin("marketing"), async (c) => {
    const base = Deno.env.get("POSTIZ_BASE_URL");
    const key = Deno.env.get("POSTIZ_API_KEY");
    if (!base || !key) return c.json({ error: "postiz not configured" }, 503);
    const path = c.req.path.replace("/admin/postiz/proxy", "");
    const target = `${base}/public/v1${path}${new URL(c.req.url).search}`;
    const init: RequestInit = {
      method: c.req.method,
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: c.req.method === "GET" || c.req.method === "HEAD" ? undefined : await c.req.text(),
    };
    const r = await fetch(target, init);
    const body = await r.text();
    if (c.req.method !== "GET") {
      await audit(c, "postiz_proxy", { method: c.req.method, path }, { type: "postiz", id: path });
    }
    return new Response(body, {
      status: r.status,
      headers: { "Content-Type": r.headers.get("content-type") ?? "application/json" },
    });
  });

  // ── Coverage partners (Survivor 7) ─────────────────────────────────────
  // List, create, rotate-secret, disable.
  app.get("/admin/coverage/partners", requireAdmin("analyst"), async (c) => {
    const { data, error } = await admin()
      .from("coverage_partners")
      .select("id, slug, display_name, contact_email, daily_minutes_cap_per_child, rpm_limit, disabled_at, created_at, notes")
      .order("created_at", { ascending: false });
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  });

  app.post("/admin/coverage/partners", requireAdmin("superadmin"), async (c) => {
    const body = (await c.req.json()) as {
      slug?: string;
      displayName?: string;
      contactEmail?: string;
      dailyMinutesCapPerChild?: number;
      rpmLimit?: number;
      notes?: string;
    };
    if (!body.slug || !body.displayName || !body.contactEmail) {
      return c.json({ error: "slug, displayName, contactEmail required" }, 400);
    }
    const secretBytes = new Uint8Array(32);
    crypto.getRandomValues(secretBytes);
    const secretHex = Array.from(secretBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { data, error } = await admin()
      .from("coverage_partners")
      .insert({
        slug: body.slug,
        display_name: body.displayName,
        contact_email: body.contactEmail,
        signing_secret: `\\x${secretHex}`,
        daily_minutes_cap_per_child: body.dailyMinutesCapPerChild ?? 60,
        rpm_limit: body.rpmLimit ?? 600,
        notes: body.notes ?? null,
        created_by: (c.get("admin") as { userId: string }).userId,
      })
      .select("id, slug")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "coverage_partner_create", { slug: body.slug }, { type: "coverage_partner", id: String(data?.id ?? "") });
    // Returning the secret ONCE — never queryable again.
    return c.json({ data, signingSecret: secretHex });
  });

  app.post("/admin/coverage/partners/:id/rotate", requireAdmin("superadmin"), async (c) => {
    const id = c.req.param("id");
    const secretBytes = new Uint8Array(32);
    crypto.getRandomValues(secretBytes);
    const secretHex = Array.from(secretBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await admin()
      .from("coverage_partners")
      .update({ signing_secret: `\\x${secretHex}` })
      .eq("id", id);
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "coverage_partner_rotate_secret", null, { type: "coverage_partner", id });
    return c.json({ signingSecret: secretHex });
  });

  app.post("/admin/coverage/partners/:id/disable", requireAdmin("superadmin"), async (c) => {
    const id = c.req.param("id");
    const { error } = await admin()
      .from("coverage_partners")
      .update({ disabled_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return c.json({ error: error.message }, 500);
    await audit(c, "coverage_partner_disable", null, { type: "coverage_partner", id });
    return c.json({ ok: true });
  });

  app.get("/admin/coverage/recent", requireAdmin("analyst"), async (c) => {
    const limit = Math.min(Number(c.req.query("limit") ?? 50), 200);
    const { data, error } = await admin()
      .from("coverage_credits")
      .select("id, partner_id, child_id, duration_seconds, brain_region, competency_ids, modality, signed_at")
      .order("signed_at", { ascending: false })
      .limit(limit);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  });

  // ── Audit log (analyst+) ───────────────────────────────────────────────
  app.get("/admin/audit", requireAdmin("analyst"), async (c) => {
    const limit = Math.min(Number(c.req.query("limit") ?? 100), 500);
    const { data, error } = await admin()
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ data });
  });
}

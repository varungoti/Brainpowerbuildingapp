// @ts-nocheck
// Growth Levers — admin endpoints for the activation funnel, subscription
// health, paywall A/B variants, cohort retention, referrals, and lifecycle
// rules. See migration 00020_growth_levers.sql for the data shape.
//
// Wired into the main edge function via `registerGrowthLeversRoutes(app, deps)`
// from `index.tsx`. Public client-facing endpoints (variant assignment +
// referral redemption) live here too — the helpers receive the existing
// `enforceRateLimit` and `admin()` so they share infrastructure.

import { type Context, type Hono } from "npm:hono";

interface Deps {
  admin: () => any;
  enforceRateLimit: (c: Context, key: string, max: number, windowSec: number) => Promise<Response | null>;
  requireAdmin: (role: string) => (c: Context, next: () => Promise<void>) => Promise<unknown>;
  cleanString: (value: unknown, max?: number) => string;
  optionalString: (value: unknown, max?: number) => string | null;
  numberInRange: (value: unknown, min: number, max: number, fallback: number) => number;
  jsonObject: (value: unknown) => Record<string, unknown>;
  audit: (c: Context, action: string, payload?: Record<string, unknown>, target?: { type: string; id: string }) => Promise<void>;
}

// Funnel-relevant subset — must match what the client SDK sends.
export const FUNNEL_EVENTS = new Set<string>([
  "auth_view",
  "auth_submit_attempt",
  "auth_submit_success",
  "onboard_step_view",
  "onboard_complete",
  "first_activity_open",
  "first_activity_complete",
  "paywall_view",
  "paywall_plan_select",
  "paywall_checkout_start",
  "paywall_purchase_success",
  "paywall_purchase_fail",
  "paywall_checkout_dismiss",
]);

function actorHashFromCtx(c: Context): string {
  // Prefer client-provided device id over IP — IP is shared on mobile networks.
  const dev = c.req.header("x-actor-id") ?? "";
  if (dev) return dev.slice(0, 128);
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const ua = c.req.header("user-agent") ?? "";
  return `${ip}:${ua}`.slice(0, 256) || "anon";
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function deriveActorHash(c: Context): Promise<string> {
  const pepper = Deno.env.get("FUNNEL_ACTOR_PEPPER") ?? "neurospark-funnel-v1";
  return sha256(`${pepper}:${actorHashFromCtx(c)}`);
}

// Cheap hash-based bucket: maps actor → 0..99
function bucketOf(actorHash: string): number {
  // First 4 hex chars → up to 65535 → mod 100
  const n = parseInt(actorHash.slice(0, 4), 16);
  return Number.isFinite(n) ? n % 100 : 0;
}

/**
 * Persists a funnel event to growth_funnel_events. Best-effort: never throws
 * to caller, returns the event id or null. Called from the existing
 * /analytics/event handler in addition to the KV daily counter so the funnel
 * dashboard works alongside legacy KV rollups.
 */
export async function recordFunnelEvent(deps: Deps, c: Context, body: { event: string; ts?: string; props?: Record<string, unknown>; variant_key?: string; utm_source?: string; utm_campaign?: string }): Promise<string | null> {
  if (!FUNNEL_EVENTS.has(body.event)) return null;
  try {
    const sb = deps.admin();
    const actorHash = await deriveActorHash(c);
    const occurredAt = typeof body.ts === "string" && body.ts.length >= 10 ? new Date(body.ts).toISOString() : new Date().toISOString();
    const { data } = await sb
      .from("growth_funnel_events")
      .insert({
        actor_hash: actorHash,
        event_name: body.event,
        variant_key: body.variant_key ?? null,
        props: deps.jsonObject(body.props ?? {}),
        utm_source: deps.optionalString(body.utm_source, 80),
        utm_campaign: deps.optionalString(body.utm_campaign, 120),
        occurred_at: occurredAt,
      })
      .select("id")
      .maybeSingle();
    return data?.id ? String(data.id) : null;
  } catch (err) {
    console.warn("[growth-levers] funnel insert failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

export function registerGrowthLeversRoutes(app: Hono, deps: Deps): void {
  // ── Public: paywall variant assignment ───────────────────────────────────
  // Returns a sticky variant for an actor. Clients call this once per
  // paywall-mount and use the returned `variant_key` in subsequent events.
  app.post("/make-server-76b0ba9a/growth/paywall/assign", async (c) => {
    const rl = await deps.enforceRateLimit(c, "growth-variant-assign", 60, 300);
    if (rl) return rl;
    return assignVariant(deps, c);
  });
  app.post("/growth/paywall/assign", async (c) => {
    const rl = await deps.enforceRateLimit(c, "growth-variant-assign", 60, 300);
    if (rl) return rl;
    return assignVariant(deps, c);
  });

  // ── Public: referral redemption (creates pending row; admin rewards) ─────
  app.post("/make-server-76b0ba9a/growth/referral/redeem", async (c) => {
    const rl = await deps.enforceRateLimit(c, "growth-referral-redeem", 30, 300);
    if (rl) return rl;
    return redeemReferral(deps, c);
  });
  app.post("/growth/referral/redeem", async (c) => {
    const rl = await deps.enforceRateLimit(c, "growth-referral-redeem", 30, 300);
    if (rl) return rl;
    return redeemReferral(deps, c);
  });

  // ── Admin: consolidated overview for Growth Levers section ───────────────
  app.get("/admin/growth/levers/overview", deps.requireAdmin("marketing"), async (c) => {
    const sb = deps.admin();
    const since = c.req.query("since") ?? new Date(Date.now() - 30 * 86_400 * 1000).toISOString().slice(0, 10);
    const sinceIso = `${since}T00:00:00Z`;
    const [funnel, variants, conversion, subHealth, cohorts, refMetrics, lifecycleRules, lifecycleRuns, lifecycleDue] = await Promise.all([
      sb.from("growth_funnel_overview_v").select("*").gte("day", since),
      sb.from("growth_paywall_variants").select("*").order("created_at", { ascending: false }),
      sb.from("growth_paywall_conversion_v").select("*"),
      sb.from("growth_subscription_health_v").select("*"),
      sb.from("growth_cohort_retention_v").select("*"),
      sb.from("growth_referral_metrics_v").select("*"),
      sb.from("growth_lifecycle_rules").select("*").order("created_at", { ascending: false }),
      sb.from("growth_lifecycle_runs").select("*").order("ran_at", { ascending: false }).limit(20),
      sb.from("growth_lifecycle_due_v").select("*"),
    ]);

    const recentEvents = await sb
      .from("growth_funnel_events")
      .select("id, event_name, variant_key, occurred_at, utm_source, utm_campaign")
      .gte("occurred_at", sinceIso)
      .order("occurred_at", { ascending: false })
      .limit(100);

    return c.json({
      funnel: funnel.data ?? [],
      funnelError: funnel.error?.message ?? null,
      variants: variants.data ?? [],
      conversion: conversion.data ?? [],
      subscriptionHealth: subHealth.data ?? [],
      subscriptionHealthError: subHealth.error?.message ?? null,
      cohorts: cohorts.data ?? [],
      referralMetrics: refMetrics.data ?? [],
      lifecycleRules: lifecycleRules.data ?? [],
      lifecycleRuns: lifecycleRuns.data ?? [],
      lifecycleDue: lifecycleDue.data ?? [],
      recentEvents: recentEvents.data ?? [],
    });
  });

  // ── Admin: paywall variants ──────────────────────────────────────────────
  app.post("/admin/growth/paywall-variants", deps.requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const variantKey = deps.cleanString(body.variantKey ?? body.variant_key, 80);
    const name = deps.cleanString(body.name, 200);
    if (!variantKey || !/^[a-z0-9_-]+$/i.test(variantKey)) {
      return c.json({ error: "variantKey must be alphanumeric (a-z, 0-9, _, -)" }, 400);
    }
    if (!name) return c.json({ error: "name required" }, 400);

    const allocationPct = Math.round(deps.numberInRange(body.allocationPct ?? body.allocation_pct, 0, 100, 50));
    const status = deps.cleanString(body.status, 20) || "draft";
    if (!["draft", "active", "paused", "retired"].includes(status)) {
      return c.json({ error: "invalid status" }, 400);
    }

    const { data, error } = await deps.admin()
      .from("growth_paywall_variants")
      .upsert(
        {
          variant_key: variantKey,
          name,
          headline: deps.optionalString(body.headline, 240),
          sub_copy: deps.optionalString(body.subCopy ?? body.sub_copy, 600),
          price_label: deps.optionalString(body.priceLabel ?? body.price_label, 80),
          plan_id: deps.optionalString(body.planId ?? body.plan_id, 80),
          allocation_pct: allocationPct,
          status,
          hypothesis: deps.optionalString(body.hypothesis, 1000),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "variant_key" },
      )
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);

    await deps.audit(c, "paywall_variant_upsert", { variantKey, status, allocationPct }, { type: "paywall_variant", id: variantKey });
    return c.json({ data });
  });

  app.post("/admin/growth/paywall-variants/:key/status", deps.requireAdmin("marketing"), async (c) => {
    const variantKey = c.req.param("key");
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const status = deps.cleanString(body.status, 20);
    if (!["draft", "active", "paused", "retired"].includes(status)) {
      return c.json({ error: "invalid status" }, 400);
    }
    const { data, error } = await deps.admin()
      .from("growth_paywall_variants")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("variant_key", variantKey)
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await deps.audit(c, "paywall_variant_status", { variantKey, status }, { type: "paywall_variant", id: variantKey });
    return c.json({ data });
  });

  // ── Admin: referrals ─────────────────────────────────────────────────────
  app.post("/admin/growth/referrals/issue", deps.requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const userId = deps.optionalString(body.userId ?? body.user_id, 64);
    const code = deps.cleanString(body.code, 32) || randomCode();
    const rewardLabel = deps.cleanString(body.rewardLabel ?? body.reward_label, 200) || "1 free month for both";
    const { data, error } = await deps.admin()
      .from("growth_referral_codes")
      .upsert({ user_id: userId, code, reward_label: rewardLabel }, { onConflict: "code" })
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await deps.audit(c, "referral_code_issued", { code, userId }, { type: "referral_code", id: code });
    return c.json({ data });
  });

  app.post("/admin/growth/referrals/:id/reward", deps.requireAdmin("marketing"), async (c) => {
    const id = c.req.param("id");
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const amount = deps.numberInRange(body.amountInr ?? body.amount_inr, 0, 100_000, 0);
    const { data, error } = await deps.admin()
      .from("growth_referral_redemptions")
      .update({
        status: "rewarded",
        reward_amount_inr: amount,
        rewarded_at: new Date().toISOString(),
        notes: deps.optionalString(body.notes, 1000),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await deps.audit(c, "referral_rewarded", { id, amount }, { type: "referral_redemption", id });
    return c.json({ data });
  });

  // ── Admin: lifecycle rules ───────────────────────────────────────────────
  app.post("/admin/growth/lifecycle/rules", deps.requireAdmin("marketing"), async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const ruleKey = deps.cleanString(body.ruleKey ?? body.rule_key, 80);
    const name = deps.cleanString(body.name, 200);
    const triggerKind = deps.cleanString(body.triggerKind ?? body.trigger_kind, 60);
    const actionKind = deps.cleanString(body.actionKind ?? body.action_kind, 40);
    if (!ruleKey || !name || !triggerKind || !actionKind) {
      return c.json({ error: "ruleKey, name, triggerKind, actionKind required" }, 400);
    }
    const allowedTriggers = ["inactive_days", "signup_day_n", "paywall_abandoned", "subscription_expiring", "first_activity_missing"];
    const allowedActions = ["push", "email", "whatsapp", "in_app_banner"];
    if (!allowedTriggers.includes(triggerKind)) return c.json({ error: "invalid triggerKind" }, 400);
    if (!allowedActions.includes(actionKind)) return c.json({ error: "invalid actionKind" }, 400);

    const { data, error } = await deps.admin()
      .from("growth_lifecycle_rules")
      .upsert(
        {
          rule_key: ruleKey,
          name,
          segment: deps.cleanString(body.segment, 80) || "all",
          trigger_kind: triggerKind,
          trigger_params: deps.jsonObject(body.triggerParams ?? body.trigger_params),
          action_kind: actionKind,
          action_params: deps.jsonObject(body.actionParams ?? body.action_params),
          enabled: typeof body.enabled === "boolean" ? body.enabled : true,
          cooldown_hours: Math.round(deps.numberInRange(body.cooldownHours ?? body.cooldown_hours, 0, 720, 24)),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "rule_key" },
      )
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await deps.audit(c, "lifecycle_rule_upsert", { ruleKey }, { type: "lifecycle_rule", id: ruleKey });
    return c.json({ data });
  });

  app.post("/admin/growth/lifecycle/rules/:key/toggle", deps.requireAdmin("marketing"), async (c) => {
    const key = c.req.param("key");
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const enabled = typeof body.enabled === "boolean" ? body.enabled : false;
    const { data, error } = await deps.admin()
      .from("growth_lifecycle_rules")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("rule_key", key)
      .select("*")
      .maybeSingle();
    if (error) return c.json({ error: error.message }, 500);
    await deps.audit(c, "lifecycle_rule_toggle", { key, enabled }, { type: "lifecycle_rule", id: key });
    return c.json({ data });
  });

  app.post("/admin/growth/lifecycle/run-due", deps.requireAdmin("marketing"), async (c) => {
    const sb = deps.admin();
    const due = await sb.from("growth_lifecycle_due_v").select("*").eq("due", true);
    if (due.error) return c.json({ error: due.error.message }, 500);

    const results: Array<{ ruleKey: string; targetCount: number; enqueuedCount: number; error?: string }> = [];
    for (const rule of due.data ?? []) {
      try {
        const targets = await targetsForRule(sb, rule);
        let enqueued = 0;
        // We enqueue into crm_tasks (from migration 00018) so the existing
        // queue + admin views handle delivery + retry. action_kind goes into
        // task type so the worker (or admin) knows how to deliver.
        if (targets.length > 0) {
          const taskRows = targets.map((t) => ({
            type: rule.action_kind,
            title: rule.name,
            status: "Scheduled",
            payload: {
              rule_key: rule.rule_key,
              target: t,
              action_params: rule.action_params,
            },
            run_at: new Date().toISOString(),
          }));
          const insertRes = await sb.from("crm_tasks").insert(taskRows).select("id");
          enqueued = insertRes.data?.length ?? 0;
        }
        await sb.from("growth_lifecycle_runs").insert({
          rule_id: rule.id,
          target_count: targets.length,
          enqueued_count: enqueued,
        });
        await sb.from("growth_lifecycle_rules").update({ last_run_at: new Date().toISOString() }).eq("id", rule.id);
        results.push({ ruleKey: rule.rule_key, targetCount: targets.length, enqueuedCount: enqueued });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await sb.from("growth_lifecycle_runs").insert({
          rule_id: rule.id,
          target_count: 0,
          enqueued_count: 0,
          error: msg,
        });
        results.push({ ruleKey: rule.rule_key, targetCount: 0, enqueuedCount: 0, error: msg });
      }
    }
    await deps.audit(c, "lifecycle_run_due", { results });
    return c.json({ ran: results.length, results });
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function assignVariant(deps: Deps, c: Context): Promise<Response> {
  try {
    const actorHash = await deriveActorHash(c);
    const sb = deps.admin();
    // Sticky: if the actor already has an assignment, return it.
    const existing = await sb.from("growth_paywall_assignments").select("variant_key").eq("actor_hash", actorHash).maybeSingle();
    if (existing.data?.variant_key) {
      const variant = await sb.from("growth_paywall_variants").select("*").eq("variant_key", existing.data.variant_key).maybeSingle();
      return c.json({ variant: variant.data, sticky: true });
    }

    // No assignment yet — pick proportional to allocation_pct of active variants.
    const variants = await sb
      .from("growth_paywall_variants")
      .select("variant_key, allocation_pct, headline, sub_copy, price_label, plan_id, name")
      .eq("status", "active");
    const active = (variants.data ?? []).filter((v) => Number(v.allocation_pct ?? 0) > 0);
    if (active.length === 0) return c.json({ variant: null, sticky: false });

    const totalAllocation = active.reduce((sum, v) => sum + Number(v.allocation_pct ?? 0), 0);
    const bucket = bucketOf(actorHash) % Math.max(1, totalAllocation);
    let cumulative = 0;
    let chosen = active[0];
    for (const v of active) {
      cumulative += Number(v.allocation_pct ?? 0);
      if (bucket < cumulative) {
        chosen = v;
        break;
      }
    }
    await sb.from("growth_paywall_assignments").upsert({ actor_hash: actorHash, variant_key: chosen.variant_key }, { onConflict: "actor_hash" });
    return c.json({ variant: chosen, sticky: false });
  } catch (err) {
    console.warn("assignVariant failed:", err instanceof Error ? err.message : String(err));
    return c.json({ variant: null, error: "assignment_failed" }, 500);
  }
}

async function redeemReferral(deps: Deps, c: Context): Promise<Response> {
  try {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    const code = deps.cleanString(body.code, 32).toUpperCase();
    if (!code) return c.json({ ok: false, error: "code required" }, 400);
    const sb = deps.admin();
    const codeRow = await sb.from("growth_referral_codes").select("*").eq("code", code).eq("status", "active").maybeSingle();
    if (!codeRow.data) return c.json({ ok: false, error: "invalid_code" }, 404);

    const actorHash = await deriveActorHash(c);
    // Block self-referral by actor
    if (codeRow.data.user_id) {
      const own = await sb
        .from("growth_referral_redemptions")
        .select("id")
        .eq("redeemed_actor_hash", actorHash)
        .maybeSingle();
      if (own.data?.id) return c.json({ ok: true, deduped: true });
    }
    await sb.from("growth_referral_redemptions").insert({
      code,
      referrer_user_id: codeRow.data.user_id,
      redeemed_actor_hash: actorHash,
      status: "pending",
    });
    await sb.from("growth_referral_codes").update({ uses_count: (codeRow.data.uses_count ?? 0) + 1 }).eq("code", code);
    return c.json({ ok: true, reward: codeRow.data.reward_label });
  } catch (err) {
    return c.json({ ok: false, error: "redeem_failed", detail: err instanceof Error ? err.message : String(err) }, 500);
  }
}

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit 0/O/1/I for human-readable
  let out = "";
  const buf = crypto.getRandomValues(new Uint8Array(8));
  for (let i = 0; i < 8; i++) out += alphabet[buf[i] % alphabet.length];
  return out;
}

async function targetsForRule(sb: any, rule: any): Promise<Array<Record<string, unknown>>> {
  // Resolve which actors / users are affected by a given rule. Uses
  // growth_funnel_events as the source of truth for actor presence.
  // Returns up to 200 targets per run to bound queue insertion size.
  const params = rule.trigger_params ?? {};
  if (rule.trigger_kind === "inactive_days") {
    const days = Math.max(1, Math.min(60, Number(params.days ?? 3)));
    const cutoff = new Date(Date.now() - days * 86_400 * 1000).toISOString();
    // Actors whose latest event is older than cutoff
    const { data } = await sb
      .from("growth_funnel_events")
      .select("actor_hash, max_at:max(occurred_at)")
      .lte("occurred_at", cutoff)
      .limit(200);
    return (data ?? []).map((r: any) => ({ actor_hash: r.actor_hash, last_seen: r.max_at }));
  }
  if (rule.trigger_kind === "paywall_abandoned") {
    const hours = Math.max(1, Math.min(168, Number(params.hours ?? 2)));
    const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();
    // Started checkout but no purchase since
    const started = await sb
      .from("growth_funnel_events")
      .select("actor_hash, occurred_at")
      .eq("event_name", "paywall_checkout_start")
      .lte("occurred_at", cutoff)
      .limit(500);
    const purchased = await sb
      .from("growth_funnel_events")
      .select("actor_hash")
      .eq("event_name", "paywall_purchase_success")
      .gte("occurred_at", new Date(Date.now() - 7 * 86_400_000).toISOString());
    const purchasedSet = new Set((purchased.data ?? []).map((r: any) => r.actor_hash));
    return (started.data ?? [])
      .filter((r: any) => !purchasedSet.has(r.actor_hash))
      .slice(0, 200)
      .map((r: any) => ({ actor_hash: r.actor_hash, abandoned_at: r.occurred_at }));
  }
  if (rule.trigger_kind === "first_activity_missing") {
    // Signed up but never started an activity
    const signed = await sb
      .from("growth_funnel_events")
      .select("actor_hash, occurred_at")
      .eq("event_name", "auth_submit_success")
      .gte("occurred_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
      .limit(500);
    const opened = await sb
      .from("growth_funnel_events")
      .select("actor_hash")
      .in("event_name", ["first_activity_open", "first_activity_complete"]);
    const openedSet = new Set((opened.data ?? []).map((r: any) => r.actor_hash));
    return (signed.data ?? [])
      .filter((r: any) => !openedSet.has(r.actor_hash))
      .slice(0, 200)
      .map((r: any) => ({ actor_hash: r.actor_hash, signed_at: r.occurred_at }));
  }
  // signup_day_n, subscription_expiring — require profile/subscription joins
  // that vary per project. Returning empty here keeps the rule safe;
  // implement in a follow-up once the columns are confirmed.
  return [];
}

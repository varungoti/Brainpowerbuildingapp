/// <reference path="./deno.d.ts" />
import { type Context, type Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

type AdminRole = "superadmin" | "analyst" | "marketing" | "support" | "readonly";
const ROLE_RANK: Record<AdminRole, number> = {
  readonly: 1,
  support: 2,
  marketing: 3,
  analyst: 4,
  superadmin: 5,
};

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
  return { role: data.role as AdminRole, email: data.email as string };
}

export function requireAdmin(min: AdminRole) {
  return async (c: Context, next: () => Promise<void>) => {
    const auth = c.req.header("authorization") ?? "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
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
      if (ROLE_RANK[role.role] < ROLE_RANK[min]) return c.json({ error: "forbidden" }, 403);
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
    await admin().from("admin_audit_log").insert({
      actor_id: a.userId,
      actor_email: a.email,
      action,
      target_type: target?.type ?? null,
      target_id: target?.id ?? null,
      payload: payload ?? null,
      ip: c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      user_agent: c.req.header("user-agent") ?? null,
    });
  } catch (err) {
    console.error("audit failed", err);
  }
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

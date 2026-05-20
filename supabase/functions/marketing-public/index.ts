// marketing-public — public, JWT-less endpoints for the landing page funnel.
//
// Deliberately separate from `marketing-os` (which is admin-only, JWT-gated) so
// we can keep this function's surface tiny and harden it against abuse without
// affecting admin features.
//
// Routes:
//   POST /marketing-public/lead     — capture a lead from a public form
//   GET  /marketing-public/health   — liveness check (no DB)
//
// Anti-abuse:
//   - Honeypot field (`hp_field`) — if filled, silently 200 and do nothing.
//   - In-memory IP rate limit: 10 requests / 60s / IP. Resets per cold start;
//     for a hard limit add Cloudflare or supabase-functions-rate-limit.
//   - Email format check, max payload size (5 KB).
//   - Optional `x-marketing-key` shared-secret if `MARKETING_PUBLIC_KEY` is set,
//     so you can stop drive-by submitters when the form is embedded somewhere
//     untrusted (e.g. a partner's site).

import { handleOptions, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

const RATE_LIMIT_PER_MIN = 10;
const ipBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return { ok: true, remaining: RATE_LIMIT_PER_MIN - 1 };
  }
  if (bucket.count >= RATE_LIMIT_PER_MIN) return { ok: false, remaining: 0 };
  bucket.count += 1;
  return { ok: true, remaining: RATE_LIMIT_PER_MIN - bucket.count };
}

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anon";
}

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LeadInput {
  parent_name?: string;
  parentName?: string;
  email?: string;
  phone?: string;
  city?: string;
  child_age?: number;
  childAge?: number;
  concern?: string;
  source?: string;
  hp_field?: string;
  campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    const route = segments[0] === "marketing-public" ? segments[1] : segments[0];

    if (req.method === "GET" && route === "health") {
      return json({ ok: true, ts: new Date().toISOString() });
    }

    if (req.method === "POST" && route === "lead") {
      // Optional shared-secret gate — only enforce if env is set.
      const requiredKey = Deno.env.get("MARKETING_PUBLIC_KEY");
      if (requiredKey) {
        const presented = req.headers.get("x-marketing-key");
        if (presented !== requiredKey) return json({ error: "Forbidden" }, 403);
      }

      const ip = getIp(req);
      const rl = rateLimit(ip);
      if (!rl.ok) return json({ error: "Rate limited" }, 429);

      const raw = await req.text();
      if (raw.length > 5_000) return json({ error: "Payload too large" }, 413);

      let body: LeadInput;
      try {
        body = JSON.parse(raw || "{}") as LeadInput;
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      // Honeypot — bots fill hidden fields. Pretend success silently.
      if (body.hp_field && body.hp_field.length > 0) {
        return json({ ok: true });
      }

      const parentName = (body.parent_name ?? body.parentName ?? "").toString().trim();
      const email = (body.email ?? "").toString().trim().toLowerCase();
      const phone = (body.phone ?? "").toString().trim();

      if (!parentName) return json({ error: "parent_name required" }, 400);
      if (email && !EMAIL_RX.test(email)) return json({ error: "Invalid email" }, 400);
      if (!email && !phone) return json({ error: "email or phone required" }, 400);
      if (parentName.length > 200 || (body.concern ?? "").length > 2_000) {
        return json({ error: "Field length exceeded" }, 400);
      }

      const childAge = Number(body.child_age ?? body.childAge ?? 0) || null;
      const sb = adminClient();
      const { data, error } = await sb
        .from("crm_leads")
        .insert({
          parent_name: parentName,
          email: email || null,
          phone: phone || null,
          city: body.city?.toString().trim() || null,
          child_age: childAge,
          concern: body.concern?.toString().trim() || null,
          source: body.source?.toString().trim() || "Website",
          status: "New",
          temperature: "Cold",
          notes: [body.utm_source && `utm_source=${body.utm_source}`, body.utm_medium && `utm_medium=${body.utm_medium}`, body.utm_campaign && `utm_campaign=${body.utm_campaign}`, body.campaign && `campaign=${body.campaign}`]
            .filter(Boolean)
            .join(" · ") || null,
        })
        .select("id, created_at")
        .single();
      if (error) {
        return json({ error: "Failed to capture lead" }, 500);
      }

      return json({ ok: true, id: data.id, ts: data.created_at });
    }

    return json({ error: "Unknown route" }, 404);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: "marketing-public failed", detail: msg }, 500);
  }
});

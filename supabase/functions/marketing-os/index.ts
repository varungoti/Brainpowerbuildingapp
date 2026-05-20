// Marketing OS — consolidated edge function for the Revenue Sprint admin page.
//
// Routes (all under `/marketing-os/...` once deployed):
//   GET  /overview                  → dashboard summary (revenue, leads, posts, sprint days)
//   GET  /sprint                    → 10-day sprint grid with daily targets vs actuals
//   POST /sprint/score              → upsert one day's notes / actuals
//   GET  /leads                     → list crm_leads
//   POST /leads                     → create crm_lead
//   PATCH /leads/:id                → update crm_lead (status, temperature, notes)
//   POST /leads/bulk                → bulk-import (max 200 per call)
//   GET  /posts                     → list crm_posts (drafts + published)
//   POST /posts                     → save a draft post
//   PATCH /posts/:id                → update draft / counters
//   POST /content/generate          → AI-driven content for one channel; uses Fireworks
//                                     when FIREWORKS_API_KEY is set, else deterministic
//   GET  /social/posts              → list scheduled social_posts + their targets
//   POST /social/posts              → schedule a social post to N providers
//   GET  /social/accounts           → list connected social_accounts
//   POST /social/accounts           → register a social account (encrypts tokens)
//
// Auth model:
//   - This function requires JWT (verify_jwt = true in config.toml). The admin
//     UI sends the admin user's bearer; the function uses the service-role
//     client internally to bypass RLS on marketing tables.
//   - Razorpay webhook is a SEPARATE function with verify_jwt=false because it
//     authenticates by signature, not JWT.

import { handleOptions, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";
import { encryptText } from "../_shared/crypto.ts";

// ── Sprint configuration ─────────────────────────────────────────────────────
// Default 10-day curve to $10k. Hard-coded as the playbook contract; admin can
// override by writing to revenue_sprint_days directly. Numbers map to the
// "Base" scenario in docs/REVENUE_SPRINT_10K.md.
const SPRINT_GOAL_USD = 10_000;
const SPRINT_DAILY_TARGETS_USD: Array<{ day: number; goalUsd: number; theme: string; objective: string }> = [
  { day: 1, goalUsd: 0, theme: "Foundation", objective: "Razorpay links live, landing page, 30 leads in CRM, 1 Reddit post" },
  { day: 2, goalUsd: 50, theme: "Demand creation", objective: "5 founder DMs converted to call; first ₹999 sale" },
  { day: 3, goalUsd: 200, theme: "Demand creation", objective: "10 sales of Founding Beta; 1 partner conversation" },
  { day: 4, goalUsd: 500, theme: "Demand creation", objective: "First partner pilot verbal yes ($500–$2,500)" },
  { day: 5, goalUsd: 1_500, theme: "Conversion", objective: "48h Beta launch; email all leads; close partner pilot #1" },
  { day: 6, goalUsd: 2_500, theme: "Conversion", objective: "Founder calls × 5; close 1 Bundle; partner pilot #2 booked" },
  { day: 7, goalUsd: 4_000, theme: "Conversion", objective: "Cumulative $4k. If <$1k, skip ad spend day 8–10." },
  { day: 8, goalUsd: 6_000, theme: "Reinvest", objective: "Reinvest 60% revenue → boosted reel + landing test" },
  { day: 9, goalUsd: 8_000, theme: "Reinvest", objective: "LinkedIn launch post; partner pilot #3 close" },
  { day: 10, goalUsd: 10_000, theme: "Close", objective: "Close any pending Bundle / partner verbal yeses" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function pathParts(req: Request) {
  // Supabase Edge Runtime strips `/functions/v1` and forwards the rest, so
  // pathname starts at `/marketing-os/...`. Slice off the function-name segment.
  const segments = new URL(req.url).pathname.split("/").filter(Boolean);
  return segments[0] === "marketing-os" ? segments.slice(1) : segments;
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// Resolves the sprint start date from `SPRINT_START_DATE` (YYYY-MM-DD) env, or
// defaults to today. Used by /overview and auto-seeding so the admin grid lines
// up with what the playbook expects.
function sprintStartDate(): string {
  const env = Deno.env.get("SPRINT_START_DATE");
  if (env && /^\d{4}-\d{2}-\d{2}$/.test(env)) return env;
  return todayUTC();
}

function sprintDayFor(date: string, start: string): number {
  const a = Date.parse(`${date}T00:00:00Z`);
  const b = Date.parse(`${start}T00:00:00Z`);
  const days = Math.floor((a - b) / (24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(SPRINT_DAILY_TARGETS_USD.length, days + 1));
}

function inrToUsd(amountInr: number): number {
  return Math.round((amountInr / 84) * 100) / 100;
}

async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

// ── AI content generation ───────────────────────────────────────────────────
// Lightweight Fireworks call. Falls back to deterministic templates when no
// key is set or the model is paused.
const FALLBACK_CONTENT: Record<string, string> = {
  "instagram_caption": `Parents — your child does not need more screen time. They need 10 meaningful minutes with you.\n\nNeuroSpark gives you 10-minute parent-child activities that build focus, memory, reasoning, and emotional intelligence — using only what you already have at home.\n\nFounding Parent Beta is open for the next 48h.\nComment "BRAIN" and I will send the link.\n\n#parenting #brainhealth #childdevelopment`,
  "whatsapp_status": `I built NeuroSpark — 10-minute brain activities for kids 0–10.\nReply BRAIN if you want details.\nFirst-month free for early supporters.`,
  "facebook_post": `Looking for parents with children aged 0–10. I am opening NeuroSpark Founding Parent Beta. 10-minute activities that build focus, memory, reasoning, and emotional intelligence — using only what you already have at home. Comment BRAIN if you want details.`,
  "linkedin_post": `Spending the next 10 days getting NeuroSpark in front of as many parents as possible.\n\nThe insight that drove me to build it: most parenting apps are passive. Kids need 10 *meaningful* minutes with a parent — not 1 hour of a tablet babysitting them.\n\nFounding Parent Beta is open. If you are a parent of a 0–10 year old, comment "BRAIN" or DM me — I'll send a private link.`,
  "reddit_post": `Title: How I rebuilt my 4-year-old's focus in 3 weeks with 10 minutes a day\n\n[Long story — no link in body. End with: I built a free app to make this easier; DM if you want the parent guide.]`,
  "youtube_short": `Hook: 3 brain-building activities for kids that take 5 minutes\n1. Memory matching (working memory)\n2. Emotion naming (emotional regulation)\n3. Pattern sorting (logical reasoning)\n\nClose: Comment BRAIN for the NeuroSpark beta.`,
  "twitter_thread": `1/ I'm 4 days into building NeuroSpark — 10-minute parent-child activities for ages 0–10.\n2/ The thing that surprised me most: kids stay engaged longer with a parent than with any animation.\n3/ Founding Parent Beta is open for the next 10 days. ₹999 lifetime. Reply BRAIN.`,
  "cold_email": `Subject: 50 free seats for [School Name] families\n\nHi [Name],\n\nI'm Varun. I built NeuroSpark — a parent-led child development app for ages 0–10. Activities focused on focus, memory, reasoning, emotional regulation.\n\nI'm offering [School Name] 50 free family seats for 90 days, plus a custom progress report you can share with parents at the next PTM. No charge to test.\n\nWould a 15-minute call this week work? I have Tue 3pm or Thu 11am IST.\n\n— Varun`,
};

async function generateContent(channel: string, persona: string, offer: string): Promise<{ content: string; provider: string }> {
  const apiKey = Deno.env.get("FIREWORKS_API_KEY");
  const paused = Deno.env.get("AI_FIREWORKS_PAUSED") === "true";
  const fallback = FALLBACK_CONTENT[channel] ?? FALLBACK_CONTENT.instagram_caption;

  if (!apiKey || paused) return { content: fallback, provider: "deterministic" };

  const prompt = `You are a senior growth marketer for NeuroSpark, a parent-child app for ages 0–10. Generate one ${channel.replace(/_/g, " ")} post that:
- targets persona: ${persona}
- promotes the "${offer}" offer
- has exactly one CTA (Comment BRAIN, or DM "BRAIN", whichever fits the platform)
- never claims medical benefit or IQ guarantee
- is warm, founder-led, story-first
- under 220 words for Instagram/Facebook/LinkedIn, 60 for WhatsApp, 40 for Twitter, 800 for Reddit

Reply with the post text only — no preamble, no JSON, no quotes.`;

  try {
    const res = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: Deno.env.get("FIREWORKS_BUDGET_MODEL") ?? "accounts/fireworks/models/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });
    if (!res.ok) return { content: fallback, provider: "deterministic_fallback" };
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return { content: fallback, provider: "deterministic_empty" };
    return { content: text, provider: "fireworks" };
  } catch {
    return { content: fallback, provider: "deterministic_error" };
  }
}

// ── Route table ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    const sb = adminClient();
    const parts = pathParts(req);
    const [resource, sub, idOrAction] = parts;

    // ── Overview ───────────────────────────────────────────────────────────
    if (req.method === "GET" && resource === "overview") {
      const since = new Date();
      since.setUTCDate(since.getUTCDate() - 30);
      const sinceIso = since.toISOString();

      const [paymentsRes, leadsRes, postsRes, sprintRes, scheduledRes] = await Promise.all([
        sb.from("crm_payments").select("amount, currency, plan_id, paid_at, status").gte("paid_at", sinceIso).eq("status", "Paid"),
        sb.from("crm_leads").select("id, parent_name, email, status, temperature, source, created_at").order("created_at", { ascending: false }).limit(50),
        sb.from("crm_posts").select("id, title, platform, content, status, created_at").order("created_at", { ascending: false }).limit(50),
        sb.from("revenue_sprint_days").select("*").order("sprint_day", { ascending: true }),
        sb.from("social_post_targets").select("id, status, scheduled_at, provider, social_post_id").gte("scheduled_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()),
      ]);

      const payments = paymentsRes.data ?? [];
      const totalUsd = payments.reduce((sum, p) => {
        const amount = Number(p.amount ?? 0);
        return sum + (p.currency === "INR" ? inrToUsd(amount) : amount);
      }, 0);

      const byPlan = payments.reduce<Record<string, { transactions: number; usd: number }>>((acc, p) => {
        const planId = p.plan_id ?? "unknown";
        const usd = p.currency === "INR" ? inrToUsd(Number(p.amount ?? 0)) : Number(p.amount ?? 0);
        if (!acc[planId]) acc[planId] = { transactions: 0, usd: 0 };
        acc[planId].transactions += 1;
        acc[planId].usd += usd;
        return acc;
      }, {});

      let sprintDays = sprintRes.data ?? [];
      const startDate = sprintStartDate();
      const today = todayUTC();
      const sprintDayToday = sprintDayFor(today, startDate);
      let todaysSprintDay = sprintDays.find((d) => d.sprint_date === today);

      // Auto-seed today's row so the admin grid never shows an empty cell on a
      // fresh deploy. We seed inside the [day 1, day N] window only.
      const withinSprint = sprintDayToday >= 1 && sprintDayToday <= SPRINT_DAILY_TARGETS_USD.length;
      if (!todaysSprintDay && withinSprint) {
        const target = SPRINT_DAILY_TARGETS_USD.find((t) => t.day === sprintDayToday);
        const seedRes = await sb
          .from("revenue_sprint_days")
          .upsert(
            {
              sprint_day: sprintDayToday,
              sprint_date: today,
              goal_usd: target?.goalUsd ?? 0,
              actual_usd: 0,
            },
            { onConflict: "sprint_date" },
          )
          .select("*")
          .single();
        if (!seedRes.error && seedRes.data) {
          todaysSprintDay = seedRes.data;
          sprintDays = [...sprintDays, seedRes.data].sort((a, b) => a.sprint_day - b.sprint_day);
        }
      }

      const cumulativeActualUsd = sprintDays.reduce((sum, d) => sum + Number(d.actual_usd ?? 0), 0);

      return json({
        revenue: {
          last30dUsd: Math.round(totalUsd * 100) / 100,
          byPlan,
          paymentsCount: payments.length,
          sprintGoalUsd: SPRINT_GOAL_USD,
          sprintCumulativeUsd: Math.round(cumulativeActualUsd * 100) / 100,
          sprintProgressPct: Math.min(100, Math.round((cumulativeActualUsd / SPRINT_GOAL_USD) * 100)),
        },
        sprint: {
          today: todaysSprintDay ?? null,
          sprintDayToday,
          sprintStartDate: startDate,
          targets: SPRINT_DAILY_TARGETS_USD,
          days: sprintDays,
        },
        leads: leadsRes.data ?? [],
        leadsCount: (leadsRes.data ?? []).length,
        posts: postsRes.data ?? [],
        postsCount: (postsRes.data ?? []).length,
        scheduled: scheduledRes.data ?? [],
      });
    }

    // ── Sprint ─────────────────────────────────────────────────────────────
    if (req.method === "GET" && resource === "sprint") {
      const days = await sb.from("revenue_sprint_days").select("*").order("sprint_day", { ascending: true });
      return json({ targets: SPRINT_DAILY_TARGETS_USD, goalUsd: SPRINT_GOAL_USD, days: days.data ?? [] });
    }
    if (req.method === "POST" && resource === "sprint" && sub === "score") {
      const body = await readJson<{ sprintDay?: number; sprintDate?: string; actualUsd?: number; partnerUsd?: number; consumerUsd?: number; founderUsd?: number; leadsAdded?: number; postsPublished?: number; notes?: string }>(req);
      const sprintDate = body.sprintDate ?? todayUTC();
      const sprintDay = body.sprintDay ?? sprintDayFor(sprintDate, sprintStartDate());
      const upsert = await sb
        .from("revenue_sprint_days")
        .upsert(
          {
            sprint_day: sprintDay,
            sprint_date: sprintDate,
            goal_usd: SPRINT_DAILY_TARGETS_USD.find((t) => t.day === sprintDay)?.goalUsd ?? 0,
            actual_usd: body.actualUsd ?? 0,
            partner_usd: body.partnerUsd ?? 0,
            consumer_usd: body.consumerUsd ?? 0,
            founder_usd: body.founderUsd ?? 0,
            leads_added: body.leadsAdded ?? 0,
            posts_published: body.postsPublished ?? 0,
            notes: body.notes ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "sprint_date" },
        )
        .select("*")
        .single();
      if (upsert.error) throw upsert.error;
      return json({ data: upsert.data });
    }

    // ── Leads ──────────────────────────────────────────────────────────────
    if (resource === "leads") {
      if (req.method === "GET") {
        const { data, error } = await sb.from("crm_leads").select("*").order("created_at", { ascending: false }).limit(500);
        if (error) throw error;
        return json({ data });
      }
      if (req.method === "POST" && sub === "bulk") {
        const body = await readJson<{ leads?: Array<Record<string, unknown>> }>(req);
        const rows = (body.leads ?? []).slice(0, 200);
        if (rows.length === 0) return json({ error: "No leads provided" }, 400);
        const { data, error } = await sb.from("crm_leads").insert(rows).select("*");
        if (error) throw error;
        return json({ data, inserted: data?.length ?? 0 });
      }
      if (req.method === "POST") {
        const body = await readJson<Record<string, unknown>>(req);
        if (!body.parent_name) return json({ error: "parent_name required" }, 400);
        const { data, error } = await sb.from("crm_leads").insert(body).select("*").single();
        if (error) throw error;
        return json({ data });
      }
      if ((req.method === "PATCH" || req.method === "PUT") && sub) {
        const body = await readJson<Record<string, unknown>>(req);
        const { data, error } = await sb
          .from("crm_leads")
          .update({ ...body, updated_at: new Date().toISOString() })
          .eq("id", sub)
          .select("*")
          .single();
        if (error) throw error;
        return json({ data });
      }
      if (req.method === "DELETE" && sub) {
        const { error } = await sb.from("crm_leads").delete().eq("id", sub);
        if (error) throw error;
        return json({ ok: true });
      }
    }

    // ── Posts (drafts library) ─────────────────────────────────────────────
    if (resource === "posts") {
      if (req.method === "GET") {
        const { data, error } = await sb.from("crm_posts").select("*").order("created_at", { ascending: false }).limit(200);
        if (error) throw error;
        return json({ data });
      }
      if (req.method === "POST") {
        const body = await readJson<Record<string, unknown>>(req);
        if (!body.title || !body.content) return json({ error: "title + content required" }, 400);
        const { data, error } = await sb.from("crm_posts").insert(body).select("*").single();
        if (error) throw error;
        return json({ data });
      }
      if ((req.method === "PATCH" || req.method === "PUT") && sub) {
        const body = await readJson<Record<string, unknown>>(req);
        const { data, error } = await sb
          .from("crm_posts")
          .update({ ...body, updated_at: new Date().toISOString() })
          .eq("id", sub)
          .select("*")
          .single();
        if (error) throw error;
        return json({ data });
      }
    }

    // ── AI content generation ─────────────────────────────────────────────
    if (req.method === "POST" && resource === "content" && sub === "generate") {
      const body = await readJson<{ channel?: string; persona?: string; offer?: string; saveAsDraft?: boolean }>(req);
      const channel = (body.channel ?? "instagram_caption").toLowerCase();
      const persona = body.persona ?? "Indian parent of 4–8 year old, focus concern";
      const offer = body.offer ?? "Founding Parent Beta — ₹999 lifetime";
      const result = await generateContent(channel, persona, offer);
      let saved: Record<string, unknown> | null = null;
      if (body.saveAsDraft) {
        const { data, error } = await sb
          .from("crm_posts")
          .insert({
            title: `${channel} · ${new Date().toISOString().slice(0, 10)}`,
            platform: channel,
            content: result.content,
            status: "Draft",
          })
          .select("*")
          .single();
        if (error) throw error;
        saved = data;
      }
      return json({ ...result, saved });
    }

    // ── Social OS ─────────────────────────────────────────────────────────
    if (resource === "social" && sub === "accounts") {
      if (req.method === "GET") {
        const { data, error } = await sb
          .from("social_accounts")
          .select("id, provider, account_label, provider_account_id, status, scopes, metadata, expires_at, created_at, updated_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ data });
      }
      if (req.method === "POST") {
        const body = await readJson<Record<string, unknown>>(req);
        const insert: Record<string, unknown> = {
          provider: body.provider,
          account_label: body.account_label ?? body.provider,
          provider_account_id: body.provider_account_id ?? null,
          status: body.status ?? "needs_oauth",
          scopes: body.scopes ?? [],
          metadata: body.metadata ?? {},
        };
        if (typeof body.access_token === "string") insert.access_token_ciphertext = await encryptText(body.access_token);
        if (typeof body.refresh_token === "string") insert.refresh_token_ciphertext = await encryptText(body.refresh_token);
        const { data, error } = await sb.from("social_accounts").insert(insert).select("id, provider, status, created_at").single();
        if (error) throw error;
        return json({ data });
      }
    }

    if (resource === "social" && sub === "posts") {
      if (req.method === "GET") {
        const { data, error } = await sb
          .from("social_posts")
          .select("*, social_post_targets(*)")
          .order("scheduled_at", { ascending: true })
          .limit(100);
        if (error) throw error;
        return json({ data });
      }
      if (req.method === "POST") {
        const body = await readJson<{ title?: string; content?: string; scheduledAt?: string; campaign?: string; cta?: string; targets?: Array<Record<string, unknown>>; metadata?: Record<string, unknown> }>(req);
        if (!body.content) return json({ error: "content required" }, 400);
        const scheduledAt = body.scheduledAt ?? new Date().toISOString();
        const { data: post, error: postError } = await sb
          .from("social_posts")
          .insert({
            title: body.title ?? `NeuroSpark · ${scheduledAt.slice(0, 10)}`,
            content: body.content,
            approval_status: "approved",
            scheduled_at: scheduledAt,
            campaign: body.campaign ?? "Founding Parent Beta",
            cta: body.cta ?? "Comment BRAIN",
            metadata: body.metadata ?? {},
          })
          .select("*")
          .single();
        if (postError) throw postError;

        const targets = body.targets?.length ? body.targets : [{ provider: "Instagram" }];
        const rows = targets.map((t) => ({
          social_post_id: post.id,
          social_account_id: t.socialAccountId ?? t.social_account_id ?? null,
          provider: t.provider,
          status: "scheduled",
          scheduled_at: scheduledAt,
        }));
        const { data: createdTargets, error: targetError } = await sb
          .from("social_post_targets")
          .insert(rows)
          .select("*");
        if (targetError) throw targetError;
        return json({ post, targets: createdTargets });
      }
    }

    // ── Daily playbook contract (read-only) ───────────────────────────────
    if (req.method === "GET" && resource === "playbook") {
      return json({
        goalUsd: SPRINT_GOAL_USD,
        days: SPRINT_DAILY_TARGETS_USD,
        offers: [
          { id: "beta", name: "Founding Parent Beta", priceInr: 999, priceUsd: 12, priceLabel: "₹999 / $12 lifetime", planId: "beta_v1" },
          { id: "pro", name: "Founding Parent Pro", priceInr: 2499, priceUsd: 39, priceLabel: "₹2,499 / $39", planId: "pro_v1" },
          { id: "bundle", name: "Founder Bundle", priceInr: 4999, priceUsd: 99, priceLabel: "₹4,999 / $99", planId: "bundle_v1" },
          { id: "partner", name: "Preschool / Clinic Partner Pilot", priceInr: 199_999, priceUsd: 2_500, priceLabel: "₹39,999–₹1,99,999 / $500–$2,500", planId: "partner_v1" },
        ],
        channels: ["Reddit", "WhatsApp / Telegram", "Indian Parenting Facebook Groups", "LinkedIn (B2B)", "Instagram organic", "Cold email (B2B)"],
      });
    }

    return json({ error: "Unknown route", resource, sub, idOrAction }, 404);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: "Marketing OS failed", detail: msg }, 500);
  }
});

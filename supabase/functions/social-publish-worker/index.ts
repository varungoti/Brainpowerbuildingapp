// Social publish worker — drains social_post_targets in scheduled state.
//
// MVP behaviour: marks targets as "published_simulated" so the calendar moves
// forward and analytics work end-to-end. Real provider adapters (Telegram is
// the easiest first wire-up) plug in here behind a switch on `target.provider`.
//
// Auth: JWT disabled, but every request must carry `x-cron-secret: $CRON_SECRET`.
// Schedule via Supabase pg_cron (recommended) or any external cron hitting the
// endpoint every 5 minutes.

import { handleOptions, json } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

function assertCron(req: Request) {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) return; // unset → development mode, no auth required
  const got = req.headers.get("x-cron-secret");
  if (got !== expected) throw new Error("Invalid cron secret");
}

interface TargetRow {
  id: string;
  provider: string;
  attempts: number | null;
  social_posts: { content?: string | null; cta?: string | null } | null;
}

interface PublishResult {
  provider: string;
  simulated: boolean;
  providerPostId: string;
  message: string;
  contentPreview: string;
}

async function publishTelegram(content: string): Promise<PublishResult | null> {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chat = Deno.env.get("TELEGRAM_CHANNEL_ID");
  if (!token || !chat) return null;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: content, disable_web_page_preview: true }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(`Telegram publish failed: ${JSON.stringify(data)}`);
  }
  return {
    provider: "Telegram",
    simulated: false,
    providerPostId: String(data?.result?.message_id ?? `tg_${crypto.randomUUID()}`),
    message: "Telegram message sent",
    contentPreview: content.slice(0, 120),
  };
}

async function simulatePublish(target: TargetRow): Promise<PublishResult> {
  const post = target.social_posts;
  return {
    provider: target.provider,
    simulated: true,
    providerPostId: `sim_${crypto.randomUUID()}`,
    message: "Live adapter not connected. Marked published in simulation mode — copy content and post manually.",
    contentPreview: String(post?.content ?? "").slice(0, 120),
  };
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    if (req.method !== "POST") return json({ error: "Use POST" }, 405);
    assertCron(req);

    const sb = adminClient();
    const nowIso = new Date().toISOString();
    const { data: targets, error } = await sb
      .from("social_post_targets")
      .select("id, provider, attempts, social_posts(content, cta)")
      .eq("status", "scheduled")
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(20);
    if (error) throw error;

    const results: Array<Record<string, unknown>> = [];
    for (const target of (targets ?? []) as TargetRow[]) {
      try {
        let result: PublishResult | null = null;
        if (target.provider === "Telegram") {
          result = await publishTelegram(target.social_posts?.content ?? "");
        }
        if (!result) result = await simulatePublish(target);

        const status = result.simulated ? "published_simulated" : "published";
        const update = await sb
          .from("social_post_targets")
          .update({
            status,
            provider_post_id: result.providerPostId,
            publish_response: result,
            published_at: new Date().toISOString(),
            attempts: Number(target.attempts ?? 0) + 1,
          })
          .eq("id", target.id);
        if (update.error) throw update.error;
        results.push({ id: target.id, ok: true, status, provider: result.provider });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await sb
          .from("social_post_targets")
          .update({
            status: "failed",
            error: msg,
            attempts: Number(target.attempts ?? 0) + 1,
          })
          .eq("id", target.id);
        results.push({ id: target.id, ok: false, error: msg });
      }
    }

    return json({ processed: results.length, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: "Worker failed", detail: msg }, 500);
  }
});

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

export type AiCostRoute =
  | "ai-counselor"
  | "coach"
  | "voice-turn"
  | "narrative-generate"
  | "printable-guide"
  | "printable-image";

export interface AiCostRecord {
  route: AiCostRoute;
  provider: string;
  model: string;
  estimatedCostUSD: number;
  latencyMs?: number;
}

function adminClient(): ReturnType<typeof createClient> | null {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function recordAiCost(record: AiCostRecord): Promise<void> {
  const sb = adminClient();
  if (!sb) return;
  try {
    await sb.from("studio_cost_ledger").insert({
      service: `ai:${record.route}`,
      provider: `${record.provider}:${record.model}`.slice(0, 120),
      cost_usd: Math.max(0, record.estimatedCostUSD),
      latency_ms: record.latencyMs != null ? Math.round(record.latencyMs) : null,
    });
  } catch (err) {
    console.warn("recordAiCost failed", err);
  }
}

export async function getAiMonthSpendUSD(): Promise<number> {
  const sb = adminClient();
  if (!sb) return 0;
  try {
    const since = new Date(Date.now() - 30 * 86_400 * 1000).toISOString();
    const { data, error } = await sb
      .from("studio_cost_ledger")
      .select("cost_usd")
      .like("service", "ai:%")
      .gte("created_at", since)
      .limit(5000);
    if (error || !data) return 0;
    return data.reduce((sum, row) => sum + Number((row as { cost_usd?: unknown }).cost_usd ?? 0), 0);
  } catch {
    return 0;
  }
}

export function getAiMonthlyCapUSD(): number {
  const raw = Deno.env.get("AI_MONTHLY_USD_CAP") ?? Deno.env.get("FIREWORKS_MONTHLY_USD_CAP") ?? "75";
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 75;
}

export async function isAiSpendOverCap(nextCostUSD = 0): Promise<boolean> {
  const cap = getAiMonthlyCapUSD();
  const spend = await getAiMonthSpendUSD();
  return spend + nextCostUSD >= cap;
}

export function estimateTextCostUSD(model: string, inputTokens: number, outputTokens: number): number {
  const id = model.toLowerCase();
  let inputPerMillion = 0.15;
  let outputPerMillion = 0.60;

  if (id.includes("gpt-oss-20b")) {
    inputPerMillion = 0.07;
    outputPerMillion = 0.30;
  } else if (id.includes("gpt-oss-120b")) {
    inputPerMillion = 0.15;
    outputPerMillion = 0.60;
  } else if (id.includes("gpt-4o-mini")) {
    inputPerMillion = 0.15;
    outputPerMillion = 0.60;
  } else if (id.includes("gpt-4o")) {
    inputPerMillion = 2.50;
    outputPerMillion = 10.00;
  }

  return (inputTokens / 1_000_000) * inputPerMillion + (outputTokens / 1_000_000) * outputPerMillion;
}

export function estimateFireworksImageCostUSD(steps = 4): number {
  return Math.max(1, steps) * 0.00035;
}

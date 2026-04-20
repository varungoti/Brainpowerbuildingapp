import type { ImageResult, ImageSpec, Provider } from "../types.js";

/**
 * Black Forest Labs FLUX.1.1 [pro] / [pro] ultra
 * Polling-based async API: POST creates a task, then poll GET get_result.
 */

const KEY = process.env.BFL_API_KEY;
const BASE = "https://api.bfl.ai/v1";

async function bflRequest(model: string, body: Record<string, unknown>): Promise<string> {
  if (!KEY) throw new Error("BFL_API_KEY not set");
  const res = await fetch(`${BASE}/${model}`, {
    method: "POST",
    headers: { "x-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`BFL ${model} error ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { id: string }).id;
}

async function bflPoll(id: string, timeoutMs = 60_000): Promise<{ url: string }> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await fetch(`${BASE}/get_result?id=${id}`, { headers: { "x-key": KEY ?? "" } });
    if (!r.ok) throw new Error(`BFL poll error ${r.status}`);
    const j = (await r.json()) as { status: string; result?: { sample: string } };
    if (j.status === "Ready" && j.result?.sample) return { url: j.result.sample };
    if (j.status === "Error" || j.status === "Failed") throw new Error(`BFL job ${id} failed`);
    await new Promise((res) => setTimeout(res, 1500));
  }
  throw new Error(`BFL job ${id} timed out`);
}

function aspectToWh(aspect: string, base = 1024): { width: number; height: number } {
  const [a, b] = aspect.split(":").map(Number);
  if (!a || !b) return { width: base, height: base };
  if (a >= b) return { width: base, height: Math.round((base * b) / a) };
  return { width: Math.round((base * a) / b), height: base };
}

export const fluxPro: Provider = {
  id: "flux_pro",
  enabled: () => Boolean(KEY),
  estCost: () => 0.06,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    const t0 = Date.now();
    const { width, height } = aspectToWh(spec.aspect ?? "1:1", spec.size ?? 1024);
    const id = await bflRequest("flux-pro-1.1-ultra", {
      prompt: spec.prompt,
      aspect_ratio: spec.aspect ?? "1:1",
      raw: false,
      seed: spec.seed,
    });
    const { url } = await bflPoll(id);
    return {
      url,
      provider: "flux_pro",
      costUSD: 0.06,
      latencyMs: Date.now() - t0,
      width,
      height,
      seed: spec.seed,
    };
  },
};

const SCHNELL_URL = process.env.FLUX_SCHNELL_URL;

export const fluxSchnellSelf: Provider = {
  id: "flux_schnell_self",
  enabled: () => Boolean(SCHNELL_URL),
  estCost: () => 0.005,
  async generate(spec: ImageSpec): Promise<ImageResult> {
    if (!SCHNELL_URL) throw new Error("FLUX_SCHNELL_URL not set");
    const t0 = Date.now();
    const res = await fetch(`${SCHNELL_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: spec.prompt,
        steps: 4,
        seed: spec.seed,
        width: spec.size ?? 1024,
        height: spec.size ?? 1024,
      }),
    });
    if (!res.ok) throw new Error(`flux-schnell self ${res.status}`);
    const data = (await res.json()) as { url: string };
    return {
      url: data.url,
      provider: "flux_schnell_self",
      costUSD: 0.005,
      latencyMs: Date.now() - t0,
      width: spec.size ?? 1024,
      height: spec.size ?? 1024,
      seed: spec.seed,
    };
  },
};

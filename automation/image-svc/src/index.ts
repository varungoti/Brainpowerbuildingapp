/**
 * NeuroSpark image-svc
 *
 * One endpoint that fans out to every supported image-generation provider so
 * the studio orchestrator can A/B for quality vs cost vs latency per scene.
 *
 * Routes:
 *   POST /v1/generate         { spec, providerId? }    -> ImageResult
 *   POST /v1/generate/batch   { specs }                -> ImageResult[]
 *   POST /v1/compare          { spec, providerIds[] }  -> { results[] } (parallel quality A/B)
 *   GET  /v1/providers                                 -> [{id, enabled, estCost}]
 *   GET  /v1/cost/month                                -> { spendUSD, capUSD }
 *   GET  /healthz
 */
import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { ALL_PROVIDERS, enabledProviders, getProvider, routeProvider } from "./providers/index.js";
import { monthSpend, recordCost } from "./ledger.js";
import type { ImageSpec, ProviderId } from "./types.js";

const app = new Hono();
app.use("*", logger());

const TOKEN = process.env.IMAGE_SVC_TOKEN ?? "change-me";
const CAP = Number(process.env.IMAGE_SVC_MONTHLY_USD_CAP ?? 60);

app.use("*", async (c, next) => {
  if (c.req.path === "/healthz") return next();
  if (c.req.header("authorization") !== `Bearer ${TOKEN}`) return c.text("unauthorized", 401);
  return next();
});

app.get("/healthz", (c) => c.json({ status: "ok", providers: enabledProviders().map((p) => p.id) }));

app.get("/v1/providers", (c) =>
  c.json(
    ALL_PROVIDERS.map((p) => ({
      id: p.id,
      enabled: p.enabled(),
      estCost: p.estCost({ prompt: "" } as ImageSpec),
    })),
  ),
);

app.get("/v1/cost/month", async (c) => {
  const spend = await monthSpend("image-svc");
  return c.json({ spendUSD: spend, capUSD: CAP });
});

async function ensureUnderCap(): Promise<void> {
  const spend = await monthSpend("image-svc");
  if (spend >= CAP) {
    throw new Error(`monthly cap exceeded: $${spend.toFixed(2)} >= $${CAP}`);
  }
}

app.post("/v1/generate", async (c) => {
  await ensureUnderCap();
  const body = (await c.req.json()) as { spec: ImageSpec; providerId?: ProviderId; jobId?: string };
  const provider = body.providerId ? getProvider(body.providerId) : routeProvider(body.spec);
  if (!provider) return c.json({ error: "no provider available" }, 400);
  if (!provider.enabled()) return c.json({ error: `provider ${provider.id} not configured` }, 400);
  try {
    const result = await provider.generate(body.spec);
    await recordCost({
      service: "image-svc",
      provider: result.provider,
      jobId: body.jobId,
      costUSD: result.costUSD,
      latencyMs: result.latencyMs,
    });
    return c.json(result);
  } catch (err) {
    return c.json({ error: (err as Error).message, provider: provider.id }, 502);
  }
});

app.post("/v1/generate/batch", async (c) => {
  await ensureUnderCap();
  const body = (await c.req.json()) as {
    specs: Array<ImageSpec & { providerId?: ProviderId }>;
    jobId?: string;
  };
  const results = await Promise.allSettled(
    body.specs.map(async (spec) => {
      const provider = spec.providerId ? getProvider(spec.providerId) : routeProvider(spec);
      if (!provider) throw new Error("no provider");
      const r = await provider.generate(spec);
      await recordCost({
        service: "image-svc",
        provider: r.provider,
        jobId: body.jobId,
        costUSD: r.costUSD,
        latencyMs: r.latencyMs,
      });
      return r;
    }),
  );
  return c.json({
    results: results.map((r) =>
      r.status === "fulfilled" ? { ok: true, ...r.value } : { ok: false, error: r.reason?.message },
    ),
  });
});

app.post("/v1/compare", async (c) => {
  await ensureUnderCap();
  const body = (await c.req.json()) as { spec: ImageSpec; providerIds: ProviderId[]; jobId?: string };
  const tasks = body.providerIds.map(async (id) => {
    const p = getProvider(id);
    if (!p?.enabled()) return { providerId: id, ok: false as const, error: "not enabled" };
    try {
      const r = await p.generate(body.spec);
      await recordCost({
        service: "image-svc",
        provider: r.provider,
        jobId: body.jobId,
        costUSD: r.costUSD,
        latencyMs: r.latencyMs,
      });
      return { providerId: id, ok: true as const, ...r };
    } catch (err) {
      return { providerId: id, ok: false as const, error: (err as Error).message };
    }
  });
  const results = await Promise.all(tasks);
  return c.json({ results });
});

const PORT = Number(process.env.PORT ?? 4401);
serve({ fetch: app.fetch, port: PORT });
console.log(`[image-svc] listening on :${PORT}, providers enabled:`, enabledProviders().map((p) => p.id).join(","));

export default app;

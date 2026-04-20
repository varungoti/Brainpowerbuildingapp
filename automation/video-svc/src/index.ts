/**
 * NeuroSpark video-svc
 *
 * Routes a single VideoSpec to one of 18 video-generation providers
 * (hosted + self-hosted) and records cost/latency to the shared
 * studio_cost_ledger table.
 *
 * Routes:
 *   POST /v1/generate         { spec, providerId? }    -> VideoResult
 *   POST /v1/generate/batch   { specs }                -> VideoResult[]
 *   POST /v1/compare          { spec, providerIds[] }  -> { results[] }  (A/B quality)
 *   GET  /v1/providers                                 -> [{id, enabled, estCost}]
 *   GET  /v1/cost/month                                -> { spendUSD, capUSD }
 *   GET  /healthz
 */
import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import {
  ALL_VIDEO_PROVIDERS,
  enabledVideoProviders,
  getVideoProvider,
  routeVideoProvider,
} from "./providers/index.js";
import { monthSpend, recordCost } from "./ledger.js";
import type { VideoProviderId, VideoSpec } from "./types.js";

const app = new Hono();
app.use("*", logger());

const TOKEN = process.env.VIDEO_SVC_TOKEN ?? "change-me";
const CAP = Number(process.env.VIDEO_SVC_MONTHLY_USD_CAP ?? 120);

app.use("*", async (c, next) => {
  if (c.req.path === "/healthz") return next();
  if (c.req.header("authorization") !== `Bearer ${TOKEN}`) return c.text("unauthorized", 401);
  return next();
});

app.get("/healthz", (c) =>
  c.json({ status: "ok", providers: enabledVideoProviders().map((p) => p.id) }),
);

app.get("/v1/providers", (c) =>
  c.json(
    ALL_VIDEO_PROVIDERS.map((p) => ({
      id: p.id,
      enabled: p.enabled(),
      estCost5s: p.estCost({ prompt: "", durationSec: 5 } as VideoSpec),
    })),
  ),
);

app.get("/v1/cost/month", async (c) => {
  const spend = await monthSpend("video-svc");
  return c.json({ spendUSD: spend, capUSD: CAP });
});

async function ensureUnderCap(): Promise<void> {
  const spend = await monthSpend("video-svc");
  if (spend >= CAP) throw new Error(`monthly cap exceeded: $${spend.toFixed(2)} >= $${CAP}`);
}

app.post("/v1/generate", async (c) => {
  await ensureUnderCap();
  const body = (await c.req.json()) as {
    spec: VideoSpec;
    providerId?: VideoProviderId;
    jobId?: string;
    routing?: { withAudio?: boolean; preferCheap?: boolean; preferOpen?: boolean };
  };
  const provider = body.providerId
    ? getVideoProvider(body.providerId)
    : routeVideoProvider({
        withAudio: body.spec.withAudio ?? body.routing?.withAudio,
        preferCheap: body.routing?.preferCheap,
        preferOpen: body.routing?.preferOpen,
      });
  if (!provider) return c.json({ error: "no provider available" }, 400);
  if (!provider.enabled()) return c.json({ error: `provider ${provider.id} not configured` }, 400);
  try {
    const result = await provider.generate(body.spec);
    await recordCost({
      service: "video-svc",
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
    specs: Array<VideoSpec & { providerId?: VideoProviderId }>;
    jobId?: string;
  };
  const results = await Promise.allSettled(
    body.specs.map(async (spec) => {
      const provider = spec.providerId ? getVideoProvider(spec.providerId) : routeVideoProvider({});
      if (!provider) throw new Error("no provider");
      const r = await provider.generate(spec);
      await recordCost({
        service: "video-svc",
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
  const body = (await c.req.json()) as {
    spec: VideoSpec;
    providerIds: VideoProviderId[];
    jobId?: string;
  };
  const results = await Promise.all(
    body.providerIds.map(async (id) => {
      const p = getVideoProvider(id);
      if (!p?.enabled()) return { providerId: id, ok: false as const, error: "not enabled" };
      try {
        const r = await p.generate(body.spec);
        await recordCost({
          service: "video-svc",
          provider: r.provider,
          jobId: body.jobId,
          costUSD: r.costUSD,
          latencyMs: r.latencyMs,
        });
        return { providerId: id, ok: true as const, ...r };
      } catch (err) {
        return { providerId: id, ok: false as const, error: (err as Error).message };
      }
    }),
  );
  return c.json({ results });
});

const PORT = Number(process.env.PORT ?? 4402);
serve({ fetch: app.fetch, port: PORT });
console.log(
  `[video-svc] listening on :${PORT}, providers enabled:`,
  enabledVideoProviders()
    .map((p) => p.id)
    .join(","),
);

export default app;

/**
 * NeuroSpark Studio orchestrator
 *
 * REST surface (consumed by /admin app + n8n):
 *   POST /studio/jobs           { template, brief, durationSec, voice, variant }
 *     -> { id, status }              (queues a script-draft job)
 *
 *   GET  /studio/jobs                -> StudioJob[]
 *   GET  /studio/jobs/:id            -> StudioJob
 *   POST /studio/jobs/:id/approve    -> queues asset/render
 *   POST /studio/jobs/:id/cancel
 *   PATCH /studio/jobs/:id/scenes    { scenes }   (operator edits storyboard)
 *
 *   GET  /studio/cost/month          -> { spendUSD, capUSD }
 *   GET  /studio/templates           -> [{id, aspect, durationGuide}]
 *   GET  /healthz
 *
 * Webhook on completion (set STUDIO_WEBHOOK_URL): POST { jobId, mp4Url }.
 */
import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { listJobs, loadJob, saveJob } from "./store.js";
import { QUEUE_DRAFT, QUEUE_RENDER, getBoss } from "./queue.js";
import { startWorker } from "./worker.js";
import type { StudioJob, TemplateId } from "./types.js";
import { PostizClient, type PostizProvider } from "../../automation/postiz/lib/postizClient.js";

const app = new Hono();
app.use("*", logger());

const TOKEN = process.env.STUDIO_BEARER_TOKEN ?? "change-me";

app.use("*", async (c, next) => {
  if (c.req.path === "/healthz") return next();
  if (c.req.header("authorization") !== `Bearer ${TOKEN}`) return c.text("unauthorized", 401);
  return next();
});

app.get("/healthz", (c) => c.json({ status: "ok" }));

const TEMPLATES: Array<{
  id: TemplateId;
  aspect: string;
  durationGuide: number;
  description: string;
}> = [
  { id: "HeroAnnouncement", aspect: "9:16", durationGuide: 45, description: "Full launch announcement" },
  { id: "FeatureSpotlight", aspect: "9:16", durationGuide: 20, description: "Single-feature deep dive" },
  { id: "TestimonialCard", aspect: "1:1", durationGuide: 15, description: "Parent quote card" },
  { id: "BrainStoryShort", aspect: "9:16", durationGuide: 30, description: "Activity + brain region story" },
  { id: "ResearchExplainer", aspect: "16:9", durationGuide: 60, description: "Research-backed explainer" },
  { id: "AppDemo", aspect: "16:9", durationGuide: 25, description: "App walkthrough in phone mockup" },
];

app.get("/studio/templates", (c) => c.json(TEMPLATES));

app.post("/studio/jobs", async (c) => {
  const body = (await c.req.json()) as {
    template: TemplateId;
    brief: string;
    durationSec?: number;
    voice?: string;
    variant?: "light" | "dark";
    autoApprove?: boolean;
  };
  const id = `j_${randomUUID()}`;
  const job: StudioJob = {
    id,
    template: body.template,
    brief: body.brief,
    durationSec: body.durationSec ?? TEMPLATES.find((t) => t.id === body.template)?.durationGuide ?? 30,
    voice: body.voice ?? "af_heart",
    variant: body.variant ?? "light",
    status: "queued",
    scenes: [],
    costUSD: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveJob(job);
  const boss = await getBoss();
  await boss.send(QUEUE_DRAFT, { id });
  if (body.autoApprove) {
    await boss.send(QUEUE_RENDER, { id }, { startAfter: 60 });
  }
  return c.json({ id, status: job.status }, 202);
});

app.get("/studio/jobs", async (c) => c.json(await listJobs()));
app.get("/studio/jobs/:id", async (c) => {
  const job = await loadJob(c.req.param("id"));
  if (!job) return c.json({ error: "not found" }, 404);
  return c.json(job);
});

app.patch("/studio/jobs/:id/scenes", async (c) => {
  const job = await loadJob(c.req.param("id"));
  if (!job) return c.json({ error: "not found" }, 404);
  if (job.status !== "awaiting_approval")
    return c.json({ error: `cannot edit in status ${job.status}` }, 409);
  const body = (await c.req.json()) as { scenes: StudioJob["scenes"]; title?: string; subtitle?: string };
  job.scenes = body.scenes;
  if (body.title !== undefined) job.title = body.title;
  if (body.subtitle !== undefined) job.subtitle = body.subtitle;
  await saveJob(job);
  return c.json(job);
});

app.post("/studio/jobs/:id/approve", async (c) => {
  const job = await loadJob(c.req.param("id"));
  if (!job) return c.json({ error: "not found" }, 404);
  if (job.status !== "awaiting_approval")
    return c.json({ error: `cannot approve in status ${job.status}` }, 409);
  job.approvedAt = new Date().toISOString();
  await saveJob(job);
  const boss = await getBoss();
  await boss.send(QUEUE_RENDER, { id: job.id });
  return c.json({ id: job.id, status: "queued_for_render" });
});

app.post("/studio/jobs/:id/cancel", async (c) => {
  const job = await loadJob(c.req.param("id"));
  if (!job) return c.json({ error: "not found" }, 404);
  job.status = "cancelled";
  await saveJob(job);
  return c.json(job);
});

/**
 * One-click "publish to social" for a finished video.
 *
 * Body shape:
 *   {
 *     channels: [{ channelId, provider, settingsOverride? }],
 *     captionOverride?: string,
 *     scheduleAt?: ISO timestamp
 *   }
 *
 * Returns Postiz response (one entry per channel).
 */
app.post("/studio/jobs/:id/publish", async (c) => {
  const job = await loadJob(c.req.param("id"));
  if (!job) return c.json({ error: "not found" }, 404);
  if (job.status !== "completed" || !job.mp4Url)
    return c.json({ error: `job not ready to publish (status=${job.status})` }, 409);
  const body = (await c.req.json()) as {
    channels: Array<{ channelId: string; provider: PostizProvider; settingsOverride?: Record<string, unknown> }>;
    captionOverride?: string;
    scheduleAt?: string;
  };
  if (!body.channels?.length) return c.json({ error: "channels[] required" }, 400);
  const caption =
    body.captionOverride ?? `${job.title ?? "NeuroSpark"}\n\n${job.subtitle ?? ""}`.trim();
  try {
    const client = new PostizClient();
    const result = await client.fanout(body.channels, caption, [job.mp4Url], {
      scheduleAt: body.scheduleAt,
      tags: [`studio_job:${job.id}`, `template:${job.template}`],
    });
    return c.json(result);
  } catch (err) {
    return c.json({ error: String((err as Error).message) }, 502);
  }
});

const PORT = Number(process.env.PORT ?? 4400);
serve({ fetch: app.fetch, port: PORT });
console.log(`[studio orchestrator] listening on :${PORT}`);

startWorker().catch((err) => {
  console.error("worker failed to start", err);
  process.exit(1);
});

export default app;
